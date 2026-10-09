import { BotSvg } from "@/components/bolu/bot-svg";
import type { Dashboard } from "./use-dashboard-state";

/** The small-screen top bar: menu button, current avatar and page title. */
export function MobileBar({ d }: { d: Dashboard }) {
  return (
    <div className="sticky top-0 z-30 hidden w-full items-center gap-2.5 border-b border-bolu-border bg-white p-[8px_12px] max-[760px]:flex">
      <button
        type="button"
        onClick={d.toggleNav}
        aria-label="Buka menu"
        aria-expanded={d.navOpen}
        className="relative flex size-11 flex-none cursor-pointer items-center justify-center rounded-[14px] border-0 bg-bolu-bg"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1E1B2E"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        {d.hasAlert ? (
          <span className="absolute right-2 top-2 size-2.5 rounded-full border-2 border-bolu-bg bg-bolu-flag" />
        ) : null}
      </button>
      <BotSvg bot={d.mIcon} className="size-8 flex-none" />
      <div className="min-w-0 flex-1 truncate font-display text-[19px] font-semibold">
        {d.mTitle}
      </div>
    </div>
  );
}
