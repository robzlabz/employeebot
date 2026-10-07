"use client";

/**
 * All dashboard interactivity — ported from the `Component` class in
 * design/dashboard-logic.js: routing, chat replies, draft verdicts, the live
 * feed timer, unread badges and toasts.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { bot, withFace, type BotShape } from "@/lib/crew";
import {
  DASH_BOTS,
  DRAFTS,
  INIT_FEED,
  ORDER,
  SEED,
  dashBot,
  type DraftId,
  type MsgFrom,
} from "./mock-data";

/** Accent used by the primary buttons and the "today" bar. */
const ACCENT = "#1F7FD6";

const DASH_VIEW = "dash";
const REPLY_DELAY_MS = 1400;
const FEED_INTERVAL_MS = 3000;
const TOAST_MS = 2600;
const MAX_FEED_ROWS = 7;
const SLEEP_REPLY = "Zzz… aku lagi istirahat. Nyalakan aku dulu dari tombol di atas, ya.";

export type FeedItem = {
  who: string;
  text: string;
  time: string;
  cls: string;
  you?: boolean;
};

export type ThreadMsg = {
  from: MsgFrom;
  text: string;
  draft: DraftId | null;
  cls: string;
};

type Verdict = Partial<Record<DraftId, "ok" | "rev">>;

type DashState = {
  /** 3-second heartbeat driving the live feed and the day's counters. */
  tick: number;
  view: string;
  threads: Record<string, ThreadMsg[]>;
  verdict: Verdict;
  paused: Record<string, boolean>;
  typing: Record<string, boolean>;
  unread: Record<string, number>;
  chatMsg: string;
  dashMsg: string;
  feed: FeedItem[];
  toast: string;
  toastBot: string;
};

function initialState(): DashState {
  const threads: Record<string, ThreadMsg[]> = {};
  for (const name of Object.keys(SEED)) {
    threads[name] = SEED[name].map(([from, text, draft]) => ({
      from,
      text,
      draft: draft ?? null,
      cls: "",
    }));
  }
  return {
    tick: 0,
    view: DASH_VIEW,
    threads,
    verdict: {},
    paused: {},
    typing: {},
    unread: { Oren: 2, Biru: 1, Lila: 1, Kunyit: 1 },
    chatMsg: "",
    dashMsg: "",
    feed: INIT_FEED.map(([who, text, time]) => ({ who, text, time, cls: "" })),
    toast: "",
    toastBot: "Oren",
  };
}

/** Feed clock: one tick every 3s, so half a minute of story time per tick. */
function clock(tick: number): string {
  const minute = 30 + Math.floor(tick / 2);
  return `10.${minute < 60 ? minute : 59}`;
}

function pushFeed(feed: FeedItem[], item: Omit<FeedItem, "time" | "cls">, tick: number): FeedItem[] {
  return [{ ...item, time: clock(tick), cls: "pop" }, ...feed].slice(0, MAX_FEED_ROWS);
}

function addMsg(
  threads: Record<string, ThreadMsg[]>,
  name: string,
  msg: Omit<ThreadMsg, "cls">,
): Record<string, ThreadMsg[]> {
  return { ...threads, [name]: [...(threads[name] ?? []), { ...msg, cls: "pop" }] };
}

/** "Suruh Bolu" routing: first bot whose keywords appear in the task. */
function routeTask(text: string): string {
  const low = text.toLowerCase();
  const match = DASH_BOTS.find((member) => member.kw.some((kw) => low.includes(kw)));
  return (match ?? DASH_BOTS[2]).name;
}

export type StatItem = { label: string; value: string; note: string };

export type PendingItem = {
  id: DraftId;
  bot: BotShape;
  botName: string;
  kind: string;
  title: string;
  meta: string;
  open: () => void;
  approve: () => void;
};

export type FeedRow = {
  key: string;
  who: string;
  text: string;
  time: string;
  cls: string;
  isYou: boolean;
  isBot: boolean;
  bot: BotShape;
};

export type WeekBar = { day: string; label: string; h: string; bg: string; weight: number };

export type BillRow = { name: string; no: string; amt: string; status: string; color: string };

export type DraftCard = {
  kind: string;
  title: string;
  draft: string;
  cta: string;
  tint: string;
  fields: { k: string; v: string }[];
  isPending: boolean;
  isDone: boolean;
  doneLabel: string;
  doneBg: string;
  approve: () => void;
  reject: () => void;
};

export type ThreadRow = {
  key: string;
  mine: boolean;
  theirs: boolean;
  text: string;
  cls: string;
  hasDraft: boolean;
  card: DraftCard | null;
};

export type ChipItem = { label: string; pick: () => void };

export type SideItem = {
  name: string;
  face: BotShape;
  line: string;
  /** Card tint, used as the selected background. */
  tint: string;
  statusColor: string;
  hasUnread: boolean;
  unread: number;
  anim: string;
  opacity: number;
  on: boolean;
  pick: () => void;
};

export type MateItem = { name: string; face: BotShape; pick: () => void };

export type CurBot = {
  name: string;
  face: BotShape;
  bio: string;
  color: string;
  tint: string;
  status: string;
  statusColor: string;
  anim: string;
  doneToday: string;
  pendingN: string;
  skills: string[];
  team: string;
  mates: MateItem[];
  off: boolean;
  toggleText: string;
  toggleLabel: string;
  trackColor: string;
  knobSide: "flex-start" | "flex-end";
  toggle: () => void;
};

/** Everything both views share: navigation, the roster, pending count, toast. */
export type DashboardShared = {
  openDash: () => void;
  open: (name: string) => void;
  side: SideItem[];
  activeLabel: string;
  hasPending: boolean;
  pendingCount: number;
  toast: string;
  toastBot: BotShape;
  logo: BotShape;
};

/** The Dasbor summary view. */
export type DashController = DashboardShared & {
  isDash: true;
  isBot: false;
  dashMsg: string;
  setDashMsg: (value: string) => void;
  sendDash: () => void;
  stats: StatItem[];
  pending: PendingItem[];
  pendingLabel: string;
  noPending: boolean;
  feed: FeedRow[];
  week: WeekBar[];
  bills: BillRow[];
  happy: BotShape;
};

/** One bot's chat view. */
export type BotController = DashboardShared & {
  isDash: false;
  isBot: true;
  chatMsg: string;
  setChatMsg: (value: string) => void;
  sendChat: () => void;
  cur: CurBot;
  big: BotShape;
  chips: ChipItem[];
  thread: ThreadRow[];
  isTyping: boolean;
  placeholder: string;
};

export type DashboardController = DashController | BotController;

export function useDashboardState(): DashboardController {
  const [state, setState] = useState<DashState>(initialState);
  const replyTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live feed: every other tick one active bot reports a finished act.
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const tick = prev.tick + 1;
        const active = DASH_BOTS.filter((member) => !prev.paused[member.name]);
        if (tick % 2 !== 0 || active.length === 0) return { ...prev, tick };
        const member = active[(tick / 2) % active.length];
        const act = member.acts[(tick / 2) % member.acts.length];
        return {
          ...prev,
          tick,
          feed: pushFeed(prev.feed, { who: member.name, text: `selesai ${act}` }, tick),
        };
      });
    }, FEED_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(
    () => () => {
      for (const timer of replyTimers.current) clearTimeout(timer);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const say = useCallback((text: string, who: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setState((prev) => ({ ...prev, toast: text, toastBot: who }));
    toastTimer.current = setTimeout(
      () => setState((prev) => ({ ...prev, toast: "" })),
      TOAST_MS,
    );
  }, []);

  const open = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      view: name,
      unread: { ...prev.unread, [name]: 0 },
      chatMsg: "",
    }));
  }, []);

  const openDash = useCallback(() => {
    setState((prev) => ({ ...prev, view: DASH_VIEW }));
  }, []);

  const talk = useCallback((name: string, text: string) => {
    const task = text.trim();
    if (!task) return;
    setState((prev) => ({
      ...prev,
      threads: addMsg(prev.threads, name, { from: "you", text: task, draft: null }),
      typing: { ...prev.typing, [name]: true },
      chatMsg: "",
    }));
    const timer = setTimeout(() => {
      setState((prev) => {
        const member = dashBot(name);
        const asleep = !!prev.paused[name];
        const reply = asleep ? SLEEP_REPLY : `Oke! Aku kerjakan: “${task}”. ${member.after}`;
        const unread = { ...prev.unread };
        if (prev.view !== name) unread[name] = (unread[name] ?? 0) + 1;
        return {
          ...prev,
          threads: addMsg(prev.threads, name, { from: "bot", text: reply, draft: null }),
          typing: { ...prev.typing, [name]: false },
          unread,
          feed: asleep
            ? prev.feed
            : pushFeed(prev.feed, { who: name, text: `menerima tugas: “${task}”` }, prev.tick),
        };
      });
    }, REPLY_DELAY_MS);
    replyTimers.current.push(timer);
  }, []);

  const decide = useCallback(
    (id: DraftId, ok: boolean) => {
      const draft = DRAFTS[id];
      setState((prev) => ({
        ...prev,
        verdict: { ...prev.verdict, [id]: ok ? "ok" : "rev" },
        threads: addMsg(prev.threads, draft.bot, {
          from: "bot",
          text: ok
            ? "Beres, sudah kukirim. Terima kasih!"
            : "Oke, aku revisi dulu ya. Nanti kukabari lagi di sini.",
          draft: null,
        }),
        feed: pushFeed(
          prev.feed,
          {
            who: "Kamu",
            you: true,
            text: ok
              ? `menyetujui ${draft.title}`
              : `minta ${draft.bot} merevisi ${draft.title}`,
          },
          prev.tick,
        ),
      }));
      say(ok ? `${draft.title} terkirim` : `${draft.bot} akan merevisi drafnya`, draft.bot);
    },
    [say],
  );

  const toggle = useCallback(
    (name: string, off: boolean) => {
      setState((prev) => ({ ...prev, paused: { ...prev.paused, [name]: !off } }));
      say(off ? `${name} kembali bekerja` : `${name} istirahat dulu`, name);
    },
    [say],
  );

  const sendDash = useCallback(() => {
    const task = state.dashMsg.trim();
    if (!task) return;
    const who = routeTask(task);
    setState((prev) => ({ ...prev, dashMsg: "" }));
    talk(who, task);
    say(`Diteruskan ke ${who}`, who);
  }, [say, state.dashMsg, talk]);

  const sendChat = useCallback(() => {
    talk(state.view, state.chatMsg);
  }, [state.chatMsg, state.view, talk]);

  const setDashMsg = useCallback((value: string) => {
    setState((prev) => ({ ...prev, dashMsg: value }));
  }, []);

  const setChatMsg = useCallback((value: string) => {
    setState((prev) => ({ ...prev, chatMsg: value }));
  }, []);

  const { tick, view, threads, verdict, paused, typing, unread } = state;

  const pending = ORDER.filter((id) => !verdict[id]);
  const waitBy: Record<string, number> = {};
  for (const id of pending) {
    const owner = DRAFTS[id].bot;
    waitBy[owner] = (waitBy[owner] ?? 0) + 1;
  }
  const doneToday = Object.keys(verdict).length;

  function face(name: string): BotShape {
    const member = dashBot(name);
    if (paused[name]) return withFace(member, { mouth: "sleep", closed: true });
    if (typing[name]) return withFace(member, { mouth: "focus", look: "translate(3 -3)" });
    return member;
  }

  function statusOf(name: string): [string, string, string] {
    if (paused[name]) return ["Istirahat", "#8B88A0", "Istirahat"];
    if (typing[name]) return ["Sedang mengetik…", "#1E7A43", "Sedang mengetik…"];
    if (waitBy[name]) return ["Menunggu kamu", "#E2602B", "Draf menunggu kamu"];
    const member = dashBot(name);
    const act = member.acts[(Math.floor(tick / 2) + DASH_BOTS.indexOf(member)) % member.acts.length];
    return ["Sedang bekerja", "#2FA65A", `Sedang ${act}`];
  }

  function cardFor(id: DraftId): DraftCard {
    const draft = DRAFTS[id];
    const decided = verdict[id];
    return {
      kind: draft.kind,
      title: draft.title,
      draft: draft.draft,
      cta: draft.cta,
      tint: dashBot(draft.bot).tint,
      fields: draft.fields.map(([k, v]) => ({ k, v })),
      isPending: !decided,
      isDone: !!decided,
      doneLabel: decided === "ok" ? "Disetujui dan terkirim" : "Diminta revisi",
      doneBg: decided === "ok" ? "#1E7A43" : "#B4421F",
      approve: () => decide(id, true),
      reject: () => decide(id, false),
    };
  }

  const isDash = view === DASH_VIEW;
  const side: SideItem[] = DASH_BOTS.map((member) => {
    const [line, statusColor] = statusOf(member.name);
    const on = view === member.name;
    const count = unread[member.name] ?? 0;
    return {
      name: member.name,
      face: face(member.name),
      line,
      tint: member.tint,
      statusColor,
      hasUnread: count > 0 && !on,
      unread: count,
      anim: paused[member.name] ? "" : "bob",
      opacity: paused[member.name] ? 0.5 : 1,
      on,
      pick: () => open(member.name),
    };
  });

  const shared = {
    openDash,
    open,
    side,
    activeLabel: `${DASH_BOTS.length - Object.values(paused).filter(Boolean).length} aktif`,
    hasPending: pending.length > 0,
    pendingCount: pending.length,
    toast: state.toast,
    toastBot: bot(state.toastBot),
    logo: bot("Oren"),
  } satisfies DashboardShared;

  if (isDash) {
    return {
      ...shared,
      isDash: true,
      isBot: false,
      dashMsg: state.dashMsg,
      setDashMsg,
      sendDash,
      stats: [
        {
          label: "Menunggu persetujuanmu",
          value: String(pending.length),
          note: pending.length ? "paling lama 12 menit" : "semua sudah beres",
        },
        {
          label: "Tugas selesai hari ini",
          value: String(77 + Math.floor(tick / 2) + doneToday),
          note: "oleh 6 anggota tim",
        },
        { label: "Perkiraan waktu dihemat", value: "± 3 jam", note: "dibanding dikerjakan manual" },
        { label: "Tagihan belum dibayar", value: "Rp 2,4 jt", note: "5 invoice · 2 lewat tempo" },
      ],
      pending: pending.map((id) => {
        const draft = DRAFTS[id];
        return {
          id,
          bot: dashBot(draft.bot),
          botName: draft.bot,
          kind: draft.kind,
          title: draft.title,
          meta: draft.meta,
          open: () => open(draft.bot),
          approve: () => decide(id, true),
        };
      }),
      pendingLabel: pending.length ? `${pending.length} draf` : "",
      noPending: pending.length === 0,
      feed: state.feed.map((item, index) => ({
        key: `${item.time}-${item.who}-${index}`,
        who: item.who,
        text: item.text,
        time: item.time,
        cls: item.cls,
        isYou: !!item.you,
        isBot: !item.you,
        bot: item.you ? bot("Oren") : bot(item.who),
      })),
      week: (
        [
          ["Sen", 86],
          ["Sel", 94],
          ["Rab", 77 + Math.floor(tick / 2) + doneToday],
          ["Kam", 0],
          ["Jum", 0],
          ["Sab", 0],
          ["Min", 0],
        ] satisfies [string, number][]
      ).map(([day, value], index) => ({
        day: String(day),
        label: value ? String(value) : "",
        h: value ? `${Math.round(Math.min(1, value / 110) * 140)}px` : "6px",
        bg: index === 2 ? ACCENT : value ? "#1E1B2E" : "#E3E5EF",
        weight: index === 2 ? 700 : 500,
      })),
      bills: [
        {
          name: "Toko Sari",
          no: "INV-0043",
          amt: "Rp 1.124.000",
          status: verdict.a1 === "ok" ? "Terkirim" : "Menunggu kamu",
          color: verdict.a1 === "ok" ? "#5E5B70" : "#B4421F",
        },
        {
          name: "Dimas",
          no: "INV-0041",
          amt: "Rp 245.000",
          status: "Belum dibayar",
          color: "#5E5B70",
        },
        {
          name: "Bagas",
          no: "INV-0039",
          amt: "Rp 189.000",
          status: "Lewat 3 hari",
          color: "#B4421F",
        },
        { name: "Rina", no: "INV-0042", amt: "Rp 170.000", status: "Lunas", color: "#1E7A43" },
      ],
      happy: withFace(dashBot("Pinky"), { mouth: "open" }),
    };
  }

  const member = dashBot(view);
  const off = !!paused[view];
  const [status, statusColor] = statusOf(view);
  const approved = ORDER.filter((id) => DRAFTS[id].bot === view && verdict[id] === "ok").length;

  return {
    ...shared,
    isDash: false,
    isBot: true,
    chatMsg: state.chatMsg,
    setChatMsg,
    sendChat,
    cur: {
      name: member.name,
      face: face(view),
      bio: member.bio,
      color: member.color,
      tint: member.tint,
      status,
      statusColor,
      anim: off ? "" : "bob",
      doneToday: String(member.done + approved),
      pendingN: String(waitBy[view] ?? 0),
      skills: member.skills,
      team: member.team,
      mates: member.mates.map((mate) => ({
        name: mate,
        face: bot(mate),
        pick: () => open(mate),
      })),
      off,
      toggleText: off ? "Istirahat" : "Aktif",
      toggleLabel: `${off ? "Nyalakan " : "Hentikan sementara "}${member.name}`,
      trackColor: off ? "#C9CDE0" : "#1E1B2E",
      knobSide: off ? "flex-start" : "flex-end",
      toggle: () => toggle(view, off),
    },
    big: off
      ? withFace(member, { mouth: "sleep", closed: true })
      : typing[view]
        ? withFace(member, { mouth: "focus", look: "translate(4 -4)" })
        : withFace(member, { mouth: "open", look: "translate(0 2)" }),
    chips: member.chips.map((label) => ({ label, pick: () => talk(view, label) })),
    thread: (threads[view] ?? []).map((msg, index) => ({
      key: `${view}-${index}`,
      mine: msg.from === "you",
      theirs: msg.from === "bot",
      text: msg.text,
      cls: msg.cls,
      hasDraft: !!msg.draft,
      card: msg.draft ? cardFor(msg.draft) : null,
    })),
    isTyping: !!typing[view],
    placeholder: `Suruh atau tanya ${view}…`,
  };
}
