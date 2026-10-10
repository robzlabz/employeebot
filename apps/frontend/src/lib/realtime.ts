"use client";

/**
 * The realtime client: one connection per tab, WebSocket first with a
 * Server-Sent Events fallback, and a resume that fills whatever it missed.
 *
 * Two details make the feed whole rather than merely live:
 * - every frame carries the event id, so a reconnect asks for everything after
 *   the last id it saw instead of hoping nothing happened;
 * - a reconnect first replays the backlog over HTTP and then opens the stream,
 *   so a gap is closed by the durable rows rather than by luck.
 */

import { getAccessToken, listEvents, type ActivityEvent } from "./api";

/**
 * parseEvent reads one streamed frame.
 *
 * The frame comes from the network, so it is validated rather than asserted: a
 * malformed one is dropped instead of reaching a renderer as a half-built
 * object. Only the fields the client acts on are checked.
 */
function parseEvent(raw: unknown): ActivityEvent | null {
  if (typeof raw !== "string") {
    return null;
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "number" || typeof candidate.type !== "string") {
    return null;
  }

  return value as ActivityEvent;
}

export type RealtimeStatus = "connecting" | "live" | "reconnecting" | "closed";

export type RealtimeHandlers = {
  onEvent: (event: ActivityEvent) => void;
  onStatus?: (status: RealtimeStatus) => void;
};

export type RealtimeConnection = {
  close: () => void;
  /** lastEventId is what a reconnect resumes from. */
  lastEventId: () => number;
  status: () => RealtimeStatus;
};

const RECONNECT_DELAYS_MS = [500, 1000, 2000, 4000, 8000];
const REPLAY_LIMIT = 200;
/** How many backlog pages a single reconnect reads before giving up on the past. */
const REPLAY_MAX_PAGES = 8;

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}

/**
 * connect opens the stream for one workspace.
 *
 * The backlog is read first and the connection opens after, which is the order
 * that cannot lose an event: anything that happens in between is either already
 * in the backlog or arrives on the connection, and an id that appears twice is
 * dropped by the caller's cursor rather than shown twice.
 */
export function connect(
  workspaceId: string,
  handlers: RealtimeHandlers,
  startAfterId = 0,
): RealtimeConnection {
  let lastId = startAfterId;
  let status: RealtimeStatus = "connecting";
  let socket: WebSocket | null = null;
  let source: EventSource | null = null;
  // window.setTimeout returns a number in the browser, so the handle needs no
  // utility type and clears unconditionally.
  let timer: number | undefined;
  let attempts = 0;
  let stopped = false;

  function setStatus(next: RealtimeStatus) {
    status = next;
    handlers.onStatus?.(next);
  }

  function deliver(event: ActivityEvent) {
    if (event.id <= lastId) {
      return;
    }
    lastId = event.id;
    handlers.onEvent(event);
  }

  async function replay() {
    for (let page = 0; page < REPLAY_MAX_PAGES; page++) {
      const result = await listEvents(workspaceId, lastId, REPLAY_LIMIT);
      if (!result.ok || result.data.length === 0) {
        return;
      }
      for (const event of result.data) {
        deliver(event);
      }
      if (result.data.length < REPLAY_LIMIT) {
        return;
      }
    }
  }

  function scheduleReconnect() {
    if (stopped) {
      return;
    }
    const delay = RECONNECT_DELAYS_MS[Math.min(attempts, RECONNECT_DELAYS_MS.length - 1)];
    attempts++;
    setStatus("reconnecting");
    timer = window.setTimeout(() => void start(), delay);
  }

  function openSocket(): boolean {
    const token = getAccessToken();
    if (!token || typeof WebSocket === "undefined") {
      return false;
    }

    const url = new URL(`${apiBase()}/api/events/socket`);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("workspace_id", workspaceId);
    url.searchParams.set("token", token);
    url.searchParams.set("last_event_id", String(lastId));

    const candidate = new WebSocket(url.toString());
    socket = candidate;

    candidate.onopen = () => {
      attempts = 0;
      setStatus("live");
    };
    candidate.onmessage = (message) => {
      const event = parseEvent(message.data);
      if (event) {
        deliver(event);
      }
    };
    candidate.onerror = () => candidate.close();
    candidate.onclose = () => {
      socket = null;
      scheduleReconnect();
    };

    return true;
  }

  function openSSE() {
    const token = getAccessToken();
    if (!token || typeof EventSource === "undefined") {
      scheduleReconnect();
      return;
    }

    // EventSource cannot set a header either, so the token travels in the query
    // like it does for the socket, and the workspace the same way.
    const url = new URL(`${apiBase()}/api/events/stream`);
    url.searchParams.set("workspace_id", workspaceId);
    url.searchParams.set("token", token);
    url.searchParams.set("last_event_id", String(lastId));

    const candidate = new EventSource(url.toString());
    source = candidate;

    candidate.onopen = () => {
      attempts = 0;
      setStatus("live");
    };
    candidate.onmessage = (message) => {
      const event = parseEvent(message.data);
      if (event) {
        deliver(event);
      }
    };
    candidate.onerror = () => {
      // EventSource reconnects by itself, but without the query string it would
      // lose the resume point, so the client owns the reconnect.
      candidate.close();
      source = null;
      scheduleReconnect();
    };
  }

  async function start() {
    if (stopped) {
      return;
    }
    setStatus(attempts === 0 ? "connecting" : "reconnecting");

    try {
      await replay();
    } catch {
      // A failed replay is not fatal: the stream still delivers from now on, and
      // the next reconnect tries the backlog again.
    }

    if (stopped) {
      return;
    }
    if (!openSocket()) {
      openSSE();
    }
  }

  void start();

  return {
    close() {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
      source?.close();
      socket = null;
      source = null;
      setStatus("closed");
    },
    lastEventId: () => lastId,
    status: () => status,
  };
}
