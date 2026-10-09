import Link from "next/link";
import { BotSvg } from "@/components/bolu/bot-svg";
import type { Dashboard, GroupSideItem, SideItem } from "./use-dashboard-state";

/** Dashboard sidebar: nav, Tim Bolu + Tim lain rosters and the bottom links. */
export function Sidebar({ d }: { d: Dashboard }) {
  return (
    <>
      {d.navOpen ? (
        <div
          onClick={d.closeNav}
          className="fixed inset-0 z-[35] hidden bg-[rgba(30,27,46,0.4)] max-[760px]:block"
        />
      ) : null}

      <div
        className={`box-border flex w-[270px] flex-none flex-col gap-1.5 border-r border-bolu-border bg-white p-[20px_14px] max-[760px]:fixed max-[760px]:inset-y-0 max-[760px]:left-0 max-[760px]:z-40 max-[760px]:w-[min(320px,86vw)] max-[760px]:overflow-y-auto max-[760px]:transition-transform max-[760px]:duration-200 ${
          d.navOpen
            ? "max-[760px]:translate-x-0 max-[760px]:shadow-[0_10px_40px_rgba(30,27,46,0.25)]"
            : "max-[760px]:-translate-x-[105%]"
        }`}
      >
        <div className="flex items-center justify-between gap-2 pb-2.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-2 text-bolu-ink no-underline hover:text-bolu-ink"
          >
            <BotSvg bot={d.logo} className="size-9" />
            <span className="font-display text-2xl font-bold">bolu</span>
          </Link>
          <button
            type="button"
            onClick={d.closeNav}
            aria-label="Tutup menu"
            className="hidden size-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-bolu-bg max-[760px]:flex"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E1B2E"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {d.nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.pick}
              aria-current={item.on ? "page" : undefined}
              className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border-0 px-3.5 text-[17px] font-bold ${
                item.on ? "bg-bolu-ink text-white" : "bg-transparent text-bolu-ink"
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
                <path d={item.icon} />
              </svg>
              <span className="flex-1 text-left">{item.label}</span>
              {item.hasBadge ? (
                <span className="rounded-full bg-bolu-flag px-2 py-px text-[13px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-2.5 pb-0.5 pt-4 text-[13px] font-bold text-bolu-muted">
          <span>Tim Bolu</span>
          <span className="font-medium">{d.activeLabel}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {d.groupsBolu.map((group) => (
            <GroupRow key={group.id} group={group} />
          ))}
          {d.sideBolu.map((member) => (
            <MemberRow key={member.name} member={member} />
          ))}
        </div>

        <div className="flex items-center justify-between px-2.5 pb-0.5 pt-4 text-[13px] font-bold text-bolu-muted">
          <span>Tim lain</span>
        </div>
        <button
          type="button"
          onClick={d.toggleHore}
          aria-expanded={d.horeOpen}
          className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[14px] border-0 bg-bolu-bg px-2.5 text-bolu-ink"
        >
          <div className="flex">
            {d.horeMinis.map((mini, index) => (
              <BotSvg key={index} bot={mini} className="-mr-1.5 size-[26px]" />
            ))}
          </div>
          <span className="ml-2 flex-1 text-left font-display text-[17px] font-semibold">
            Tim Hore
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ transform: d.horeOpen ? "rotate(180deg)" : "none" }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {d.horeOpen ? (
          <div className="ml-3 flex flex-wrap gap-1 border-l-2 border-bolu-line pl-2">
            {d.groupsHore.map((group) => (
              <GroupRow key={group.id} group={group} />
            ))}
            {d.sideHore.map((member) => (
              <MemberRow key={member.name} member={member} />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className="mt-3 flex min-h-[46px] cursor-pointer items-center gap-2.5 rounded-2xl border-2 border-dashed border-bolu-track bg-transparent px-3.5 font-semibold text-bolu-body"
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
          Buat tim atau grup
        </button>

        <div className="min-h-3 flex-1" />

        <div className="flex flex-col gap-1 border-t border-bolu-line pt-2.5">
          <button
            type="button"
            onClick={d.openInteg}
            className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border-0 px-3.5 text-[17px] font-bold ${
              d.integStyle.on ? "bg-bolu-ink text-white" : "bg-transparent text-bolu-ink"
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
              <path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0zM12 16v5" />
            </svg>
            <span className="flex-1 text-left">Integrasi</span>
            <span
              className={`text-[13px] font-bold ${
                d.integStyle.on ? "text-white" : "text-bolu-muted"
              }`}
            >
              {d.integCount}
            </span>
          </button>
          <button
            type="button"
            onClick={d.openSettings}
            className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border-0 px-3.5 text-[17px] font-bold ${
              d.settingsStyle.on ? "bg-bolu-ink text-white" : "bg-transparent text-bolu-ink"
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
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
            </svg>
            <span className="flex-1 text-left">Pengaturan</span>
          </button>
        </div>
      </div>
    </>
  );
}

function MemberRow({ member }: { member: SideItem }) {
  return (
    <button
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
          style={{ width: 44, height: 44, opacity: member.opacity, animationDelay: member.face.delay }}
        />
        <span
          className="absolute -right-px bottom-px size-[11px] rounded-full border-2 border-white"
          style={{ backgroundColor: member.statusColor }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <span className="font-display text-[17px] font-semibold leading-[1.2]">{member.name}</span>
        <span className="truncate text-[13px] text-bolu-muted">{member.line}</span>
      </div>
      {member.hasUnread ? (
        <span
          className="box-border inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[12px] font-extrabold text-bolu-ink"
          style={{ backgroundColor: member.tint }}
        >
          {member.unread}
        </span>
      ) : null}
    </button>
  );
}

function GroupRow({ group }: { group: GroupSideItem }) {
  return (
    <button
      type="button"
      onClick={group.pick}
      aria-current={group.on ? "true" : undefined}
      className={`flex min-h-[60px] min-w-0 flex-[1_1_220px] cursor-pointer items-center gap-3 rounded-2xl border-2 p-[8px_10px] text-left text-bolu-ink ${
        group.on ? "border-bolu-ink bg-bolu-line" : "border-transparent"
      }`}
    >
      <div className="relative size-11 flex-none">
        {group.minis.map((mini) => (
          <BotSvg
            key={mini.key}
            bot={mini.bot}
            className="absolute size-[26px]"
            style={{ left: mini.left, top: mini.top }}
          />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <span className="font-display text-[17px] font-semibold leading-[1.2]">{group.name}</span>
        <span className="truncate text-[13px] text-bolu-muted">{group.line}</span>
      </div>
      {group.hasUnread ? (
        <span className="box-border inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-bolu-ink px-1.5 text-[12px] font-extrabold text-white">
          {group.unread}
        </span>
      ) : null}
    </button>
  );
}
