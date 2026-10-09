import { BotSvg } from "@/components/bolu/bot-svg";
import type { Dashboard } from "./use-dashboard-state";

const LEGEND: [string, string][] = [
  ["#2FA65A", "Bekerja di mejanya"],
  ["#E2602B", "Antre di meja persetujuanmu"],
  ["#4A86E8", "Santai di pojok sofa"],
  ["#8B88A0", "Istirahat"],
];

/** The Kantor view: a top-down room where each bot walks its patrol route. */
export function OfficeView({ d }: { d: Dashboard }) {
  return (
    <div className="flex flex-col gap-[18px] p-[24px_28px_48px] max-[760px]:p-[18px_14px_36px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[36px] font-bold leading-[1.1] max-[760px]:text-[28px]">
            Kantor Tim Bolu
          </h1>
          <div className="text-bolu-muted">
            Lihat langsung siapa sedang mengerjakan apa. Ketuk salah satu Bolu untuk membuka
            obrolannya. Di layar kecil, geser ruangannya ke samping.
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
          {LEGEND.map(([color, label]) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[32px]">
        <div className="relative box-border aspect-[16/10] min-w-[820px] overflow-hidden rounded-[32px] border-[12px] border-[#2B2840] bg-[#EFE4D6] bg-[linear-gradient(#E4D6C4_2px,transparent_2px),linear-gradient(90deg,#E4D6C4_2px,transparent_2px)] bg-[length:64px_64px] max-[760px]:min-w-[620px]">
          <div className="absolute inset-x-0 top-0 h-[9%] bg-[#DCD3EA]" />
          <div className="absolute left-[8%] top-[1.5%] box-border h-[6%] w-[12%] rounded-md border-[3px] border-white bg-[#BFE3F7]" />
          <div className="absolute left-[38%] top-[1.5%] box-border h-[6%] w-[12%] rounded-md border-[3px] border-white bg-[#BFE3F7]" />
          <div className="absolute left-[66%] top-[1.6%] flex h-[5.6%] w-[12%] items-center justify-center rounded-lg bg-[#2B2840] font-display text-[14px] font-semibold text-white">
            Kantor Bolu
          </div>
          <div className="absolute left-[70%] top-[64%] h-[36%] w-[30%] rounded-tl-[120px] bg-[rgba(167,125,201,0.12)]" />

          {d.furn.map(({ key, label, isDesk, isShelf, f }) => (
            <div
              key={key}
              className="absolute box-border rounded-xl"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                width: `${f.w}%`,
                height: `${f.h}%`,
                backgroundColor: f.bg,
                ...f.extra,
              }}
            >
              {isDesk ? (
                <div className="absolute left-[30%] top-[-26%] box-border h-[46%] w-[40%] rounded-md border-[3px] border-[#4A4664] bg-[#2B2840]" />
              ) : null}
              {isShelf ? (
                <>
                  <div className="absolute inset-[8%] bg-[repeating-linear-gradient(180deg,transparent_0_22%,#8A6440_22%_26%)]" />
                  <div className="absolute left-[14%] right-[14%] top-[10%] h-[10%] bg-[repeating-linear-gradient(90deg,#4DBB72_0_14%,#F2645A_14%_26%,#2E9BEF_26%_40%,transparent_40%_46%)]" />
                </>
              ) : null}
              <span className="absolute bottom-[-22px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-bold text-[#6B6880]">
                {label}
              </span>
            </div>
          ))}

          {d.office.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.pick}
              aria-label={`Buka obrolan ${item.name}`}
              className="absolute size-16 cursor-pointer border-0 bg-transparent p-0"
              style={{
                left: `${item.left}%`,
                top: `${item.top}%`,
                transform: "translate(-50%, -100%)",
                transition: "left 2.2s ease-in-out, top 2.2s ease-in-out",
                zIndex: item.z,
              }}
            >
              <div
                className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 bg-white px-2.5 py-0.5 text-[12px] font-semibold text-bolu-ink"
                style={{ borderColor: item.statusColor }}
              >
                {item.bubble}
              </div>
              <BotSvg
                bot={item.face}
                className={`size-full ${item.anim}`}
                style={{ animationDelay: item.face.delay }}
              />
              <div className="absolute left-1/2 top-full -translate-x-1/2 rounded-md bg-[rgba(255,255,255,0.8)] px-1.5 text-[12px] font-bold text-bolu-ink">
                {item.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-2.5">
        {d.office.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.pick}
            className="flex cursor-pointer items-center gap-2.5 rounded-[18px] border border-bolu-border bg-white p-[10px_12px] text-left text-bolu-ink"
          >
            <BotSvg bot={item.face} className="size-[38px] flex-none" />
            <div className="min-w-0">
              <div className="font-bold">
                {item.name}{" "}
                <span className="text-[13px] font-semibold" style={{ color: item.statusColor }}>
                  · {item.statusText}
                </span>
              </div>
              <div className="text-[13px] text-bolu-muted">{item.where}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
