"use client";

import { BotSvg } from "@/components/bolu/bot-svg";
import { ChatView } from "./chat-view";
import { DashView } from "./dash-view";
import { Sidebar } from "./sidebar";
import { useDashboardState } from "./use-dashboard-state";

/** The whole dashboard: sidebar plus either the Dasbor summary or one bot's chat. */
export function DashboardShell() {
  const d = useDashboardState();

  return (
    <div className="flex min-h-screen flex-wrap items-stretch bg-bolu-bg text-bolu-ink">
      <Sidebar d={d} />
      <div className="box-border flex min-w-0 flex-[999_1_640px] flex-col">
        {d.isDash ? <DashView d={d} /> : <ChatView d={d} />}
      </div>
      {d.toast ? (
        <div
          role="status"
          className="pop fixed bottom-6 left-1/2 z-10 box-border flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2.5 rounded-full bg-bolu-ink p-[10px_20px_10px_10px] font-semibold text-white"
        >
          <BotSvg bot={d.toastBot} className="size-[34px] flex-none" />
          <span>{d.toast}</span>
        </div>
      ) : null}
    </div>
  );
}
