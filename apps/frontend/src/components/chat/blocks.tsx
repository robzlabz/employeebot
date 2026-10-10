"use client";

/**
 * The block renderers.
 *
 * A message is a list of typed blocks, and each type has exactly one component
 * here. That is the point of the block shape: the backend validates a document
 * against its schema, so a renderer receives a shape it can trust and never has
 * to defend itself against a half-valid one.
 *
 * Markdown is rendered without raw HTML: an agent writes prose, not markup, and
 * allowing it would turn every message into a script injection into the app. The
 * one block that may contain script is `html`, and it is framed from a separate
 * origin inside a sandbox.
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  contentURL,
  type DraftBlock,
  type HTMLBlock,
  type MessageBlock,
  type TableBlock,
  type TextBlock,
} from "@/lib/api";

/**
 * The two block types that touch the document are loaded only in the browser.
 *
 * ECharts measures an element and Mermaid renders into a live document, so
 * neither can run during server rendering; the specifier is still a literal, and
 * the library is a static import inside the module it names.
 */
const ChartView = dynamic(() => import("./chart-view"), {
  ssr: false,
  loading: () => <p className="text-sm text-bolu-muted">Menyiapkan grafik…</p>,
});

const MermaidView = dynamic(() => import("./mermaid-view"), {
  ssr: false,
  loading: () => <p className="text-sm text-bolu-muted">Menyiapkan diagram…</p>,
});

/** Block renders one block, or says so when its type is one it does not know. */
export function Block({ block }: { block: MessageBlock }) {
  switch (block.type) {
    case "text":
      return <TextBlockView block={block} />;
    case "table":
      return <TableView block={block} />;
    case "draft":
      return <DraftCard block={block} />;
    case "chart":
      return <ChartView block={block} />;
    case "mermaid":
      return <MermaidView block={block} />;
    case "html":
      return <HTMLView block={block} />;
    default:
      // A block type this client does not know is shown as such rather than
      // dropped: a message that silently loses part of itself is worse.
      return (
        <p className="rounded-xl border border-dashed border-bolu-border px-3 py-2 text-sm text-bolu-muted">
          Jenis blok yang belum dikenal aplikasi ini.
        </p>
      );
  }
}

/** TextBlockView renders Markdown, without raw HTML. */
function TextBlockView({ block }: { block: TextBlock }) {
  return (
    <div className="bolu-markdown text-[15px] leading-relaxed">
      <Markdown
        remarkPlugins={[remarkGfm]}
        // Raw HTML from an agent is dropped rather than sanitised: prose is what
        // a text block is for, and the interactive block exists for the rest.
        skipHtml
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer noopener" className="underline">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-bolu-border px-2 py-1 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border-b border-bolu-line px-2 py-1">{children}</td>,
        }}
      >
        {block.markdown}
      </Markdown>
    </div>
  );
}

/** TableView renders a table block: the columns and rows the schema validated. */
function TableView({ block }: { block: TableBlock }) {
  return (
    <figure className="my-1 overflow-x-auto">
      {block.title ? (
        <figcaption className="mb-1 text-sm font-semibold">{block.title}</figcaption>
      ) : null}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {block.columns.map((column, index) => (
              <th
                key={`${column}-${index}`}
                className="border-b border-bolu-border px-2 py-1 font-semibold"
                style={{ textAlign: block.align?.[index] ?? "left" }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border-b border-bolu-line px-2 py-1"
                  style={{ textAlign: block.align?.[cellIndex] ?? "left" }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

const DRAFT_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Menunggu kamu", className: "bg-bolu-flag/12 text-bolu-flag" },
  approved: { label: "Disetujui", className: "bg-bolu-live/12 text-bolu-lunas" },
  revise: { label: "Minta revisi", className: "bg-bolu-panel text-bolu-body" },
  sent: { label: "Terkirim", className: "bg-bolu-live/12 text-bolu-lunas" },
  canceled: { label: "Dibatalkan", className: "bg-bolu-panel text-bolu-rest" },
};

/**
 * DraftCard is the approval card.
 *
 * It shows the state and links to the dashboard rather than offering the
 * decision inline: approving is what EPIC 7 owns, and a card that could approve
 * would be a second implementation of the approval policy.
 */
function DraftCard({ block }: { block: DraftBlock }) {
  const status = DRAFT_STATUS[block.status ?? "pending"] ?? DRAFT_STATUS.pending;

  return (
    <div className="my-1 rounded-2xl border border-bolu-border bg-bolu-surface px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-bolu-muted">
            {block.action_kind ?? "Draf"}
          </p>
          <p className="truncate font-semibold">{block.title ?? "Draf menunggu persetujuan"}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>

      {block.summary ? <p className="mt-1.5 text-sm text-bolu-body">{block.summary}</p> : null}

      {block.fields && block.fields.length > 0 ? (
        <dl className="mt-2 space-y-1 text-sm">
          {block.fields.map(([label, value], index) => (
            <div key={`${label}-${index}`} className="flex gap-2">
              <dt className="w-28 shrink-0 text-bolu-muted">{label}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <a
        href="/dashboard"
        className="mt-2.5 inline-block text-sm font-medium text-bolu-accent hover:underline"
      >
        Buka di Dasbor →
      </a>
    </div>
  );
}

/**
 * HTMLView frames one sandboxed document from the content origin.
 *
 * Three things together make agent-written script safe to run:
 * - the sandbox omits allow-same-origin, so the document has an opaque origin and
 *   cannot read the application's cookies, storage, or DOM;
 * - the content origin serves it under a policy with `connect-src 'none'`, so it
 *   cannot reach the network even from inside the frame;
 * - the only message accepted from it is a resize, so it cannot drive the app.
 */
function HTMLView({ block }: { block: HTMLBlock }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  const [expanded, setExpanded] = useState(false);

  const source = useMemo(() => contentURL(block.content_ref), [block.content_ref]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // The source check is what makes the channel narrow: only the frame this
      // component rendered may resize it, and only with a resize message.
      if (event.source !== frame.current?.contentWindow) {
        return;
      }

      const data: unknown = event.data;
      if (typeof data !== "object" || data === null) {
        return;
      }
      const candidate = data as { type?: unknown; height?: unknown };
      if (candidate.type !== "resize" || typeof candidate.height !== "number") {
        return;
      }

      // The height is clamped: a document claiming to be ten thousand pixels
      // tall must not be able to push the rest of the conversation away.
      setHeight(Math.min(Math.max(candidate.height, 120), 1200));
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <figure className="my-1">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <figcaption className="text-sm font-semibold">
          {block.title ?? "Konten interaktif"}
          <span className="ml-2 text-xs font-normal text-bolu-muted">
            Konten interaktif dibuat Bolu
          </span>
        </figcaption>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-lg border border-bolu-border px-2.5 py-1 text-xs transition hover:bg-bolu-panel/60"
        >
          {expanded ? "Perkecil" : "Layar penuh"}
        </button>
      </div>

      <iframe
        ref={frame}
        title={block.title ?? "Konten interaktif dibuat Bolu"}
        src={source}
        // No allow-same-origin, no allow-forms, no allow-popups: the document
        // gets a script context and nothing else.
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        loading="lazy"
        className="w-full rounded-xl border border-bolu-border bg-white"
        style={{ height: expanded ? "80vh" : height }}
      />

      {block.caption ? <p className="mt-1 text-xs text-bolu-muted">{block.caption}</p> : null}
    </figure>
  );
}
