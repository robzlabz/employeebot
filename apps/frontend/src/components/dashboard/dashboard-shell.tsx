"use client";

import { BotSvg } from "@/components/bolu/bot-svg";
import { ChatView } from "./chat-view";
import { DashView } from "./dash-view";
import { IntegrationsModal } from "./integrations-modal";
import { IntegrationsView } from "./integrations-view";
import { MobileBar } from "./mobile-bar";
import { OfficeView } from "./office-view";
import { RoutineView } from "./routine-view";
import { SettingsView } from "./settings-view";
import { Sidebar } from "./sidebar";
import { useDashboardState } from "./use-dashboard-state";

/** The whole dashboard: mobile bar + sidebar + the active view + overlays. */
export function DashboardShell() {
  const d = useDashboardState();

  return (
    <div className="flex min-h-screen flex-wrap items-stretch bg-bolu-bg text-bolu-ink">
      <MobileBar d={d} />
      <Sidebar d={d} />
      <div className="box-border flex min-w-0 flex-[999_1_640px] flex-col">
        {d.isDash ? <DashView d={d} /> : null}
        {d.isRoutine ? <RoutineView d={d} /> : null}
        {d.isOffice ? <OfficeView d={d} /> : null}
        {d.isInteg ? <IntegrationsView d={d} /> : null}
        {d.isSettings ? <SettingsView d={d} /> : null}
        {d.isChat ? <ChatView d={d} /> : null}
      </div>

      {d.hasModal && d.md ? <IntegrationsModal md={d.md} /> : null}

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
