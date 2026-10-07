import Link from "next/link";
import { BotSvg } from "@/components/bolu/bot-svg";
import type { DashboardShared } from "./use-dashboard-state";

/**
 * Dashboard sidebar: logo, Dasbor nav, the Tim Bolu roster with live status,
 * the "add member" stub and the trial card.
 */
export function Sidebar({ d }: { d: DashboardShared & { isDash: boolean } }) {
  return (
    <div className="box-border flex max-w-full flex-[1_1_270px] flex-col gap-3.5 border-r border-bolu-border bg-white p-[20px_14px]">
      <Link
        href="/"
        className="flex items-center gap-2.5 px-2 pb-1.5 text-bolu-ink no-underline hover:text-bolu-ink"
      >
        <BotSvg bot={d.logo} className="size-9" />
        <span className="font-display text-2xl font-bold">bolu</span>
      </Link>

      <button
        type="button"
        onClick={d.openDash}
        className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border-0 px-3.5 text-[17px] font-bold ${
          d.isDash ? "bg-bolu-ink text-white" : "bg-bolu-bg text-bolu-ink"
        }`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </svg>
        <span className="flex-1 text-left">Dasbor</span>
        {d.hasPending ? (
          <span className="rounded-full bg-bolu-flag px-2 py-px text-[13px] font-bold text-white">
            {d.pendingCount}
          </span>
        ) : null}
      </button>

      <div className="flex items-center justify-between px-2.5 pt-2">
        <span className="text-[14px] font-bold text-bolu-muted">Tim Bolu</span>
        <span className="text-[13px] text-bolu-muted">{d.activeLabel}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {d.side.map((member) => (
          <button
            key={member.name}
            type="button"
            onClick={member.pick}
            aria-current={member.on ? "true" : undefined}
            className={`flex min-h-[60px] min-w-0 flex-[1_1_220px] cursor-pointer items-center gap-3 rounded-2xl border-2 p-[8px_10px] text-left text-bolu-ink ${
              member.on ? "border-bolu-ink" : "border-transparent"
            }`}
            style={{ backgroundColor: member.on ? member.tint : "transparent" }}
          >
            <div className="relative size-11 flex-none">
              <BotSvg
                bot={member.face}
                className={member.anim || undefined}
                style={{
                  width: 44,
                  height: 44,
                  opacity: member.opacity,
                  animationDelay: member.face.delay,
                }}
              />
              <span
                className="absolute -right-px bottom-px size-[11px] rounded-full border-2 border-white"
                style={{ backgroundColor: member.statusColor }}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col text-left">
              <span className="font-display text-[17px] font-semibold leading-[1.2]">
                {member.name}
              </span>
              <span className="truncate text-[13px] text-bolu-muted">{member.line}</span>
            </div>
            {member.hasUnread ? (
              <span
                className="box-border inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[12px] font-extrabold text-bolu-ink"
                style={{ backgroundColor: member.face.color }}
              >
                {member.unread}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl border-2 border-dashed border-bolu-track bg-transparent px-3.5 font-semibold text-bolu-body"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Tambah anggota Bolu
      </button>

      <div className="flex-1" />

      <div className="flex flex-col gap-1.5 rounded-[20px] bg-bolu-ink p-4 text-white">
        <div className="font-display text-[17px] font-semibold">Paket Coba</div>
        <div className="text-[14px] opacity-80">[SISA MASA COBA]</div>
        <Link href="/pricing" className="text-[14px] font-semibold text-white no-underline hover:text-white">
          Lihat paket
        </Link>
      </div>
    </div>
  );
}
