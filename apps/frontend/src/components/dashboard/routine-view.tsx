import { BotSvg } from "@/components/bolu/bot-svg";
import { ACCENT, type Dashboard, type RoutineItem } from "./use-dashboard-state";

/** The Rutinitas view: recurring work, filters, and the add-routine form. */
export function RoutineView({ d }: { d: Dashboard }) {
  return (
    <div className="flex max-w-[980px] flex-col gap-6 p-[24px_28px_48px] max-[760px]:p-[18px_14px_36px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[36px] font-bold leading-[1.1] max-[760px]:text-[28px]">
            Rutinitas
          </h1>
          <div className="text-bolu-muted">
            Pekerjaan yang dijalankan tim secara otomatis, tanpa perlu kamu suruh.{" "}
            {d.routineSummary}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {d.rFilters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={filter.pick}
            aria-pressed={filter.on}
            className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border-2 py-0 pl-2.5 pr-3.5 text-[14px] font-semibold ${
              filter.on
                ? "border-bolu-ink bg-bolu-ink text-white"
                : "border-bolu-border bg-white text-bolu-ink"
            }`}
          >
            {filter.bot ? <BotSvg bot={filter.bot} className="size-6" /> : null}
            {filter.label}
          </button>
        ))}
      </div>

      <RoutineSection
        title="Sepanjang hari"
        note="berjalan berulang tiap jam"
        items={d.rHourly}
      />
      <RoutineSection title="Setiap hari" note="diurutkan menurut jam" items={d.rDaily} />
      <RoutineSection title="Setiap minggu" note="sekali seminggu" items={d.rWeekly} />

      <div className="flex flex-col gap-3 rounded-[26px] border border-bolu-border bg-white p-5">
        <h2 className="font-display text-[22px] font-semibold">Tambah rutinitas</h2>
        <div className="flex flex-wrap items-end gap-2.5">
          <label className="flex flex-[1_1_280px] flex-col gap-1 text-[14px] font-semibold">
            Apa yang dikerjakan
            <input
              type="text"
              value={d.newText}
              onChange={(event) => d.onNewText(event.target.value)}
              placeholder="misalnya: cek folder scan dan rapikan namanya"
              className="min-h-[46px] rounded-[14px] border border-bolu-chip px-3.5 font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-[14px] font-semibold">
            Jam
            <input
              type="time"
              value={d.newTime}
              onChange={(event) => d.onNewTime(event.target.value)}
              className="min-h-[46px] rounded-[14px] border border-bolu-chip px-3 font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-[14px] font-semibold">
            Dikerjakan oleh
            <select
              value={d.newBot}
              onChange={(event) => d.onNewBot(event.target.value)}
              className="min-h-[46px] rounded-[14px] border border-bolu-chip bg-white px-3 font-normal"
            >
              {d.botNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={d.addRoutine}
            className="min-h-[46px] cursor-pointer rounded-full border-0 bg-bolu-ink px-[22px] font-bold text-white"
          >
            Tambah
          </button>
        </div>
      </div>
    </div>
  );
}

function RoutineSection({
  title,
  note,
  items,
}: {
  title: string;
  note: string;
  items: RoutineItem[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="font-display text-[22px] font-semibold">{title}</h2>
        <span className="text-[14px] text-bolu-muted">{note}</span>
      </div>
      {items.map((item) => (
        <div key={item.key}>
          {item.isNow ? (
            <div
              className="flex items-center gap-2.5 py-1 text-[14px] font-bold"
              style={{ color: ACCENT }}
            >
              <span className="pulse size-2.5 rounded-full" style={{ backgroundColor: ACCENT }} />
              Sekarang {item.time}
              <span className="h-0.5 flex-1" style={{ backgroundColor: ACCENT }} />
            </div>
          ) : null}
          {item.isItem ? <RoutineRow item={item} /> : null}
        </div>
      ))}
    </div>
  );
}

function RoutineRow({ item }: { item: RoutineItem }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[20px] border border-bolu-border p-[14px_16px]"
      style={{ backgroundColor: item.bg, opacity: item.opacity }}
    >
      <div className="w-[92px] flex-none font-display text-[20px] font-bold">{item.time}</div>
      <BotSvg bot={item.bot} className="size-[46px] flex-none" />
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
        <div className="text-[16px] font-semibold">{item.title}</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px]">
          <span className="font-semibold">{item.botName}</span>
          <span className="rounded-full bg-bolu-line px-2.5 py-px text-bolu-body">{item.freq}</span>
          <span className="font-semibold" style={{ color: item.statusColor }}>
            {item.status}
          </span>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={item.on}
        aria-label={`${item.on ? "Matikan" : "Nyalakan"} rutinitas: ${item.title}`}
        onClick={item.toggle}
        className="flex h-7 w-12 flex-none cursor-pointer rounded-full border-0 p-[3px]"
        style={{
          backgroundColor: item.on ? "#1E1B2E" : "#C9CDE0",
          justifyContent: item.on ? "flex-end" : "flex-start",
        }}
      >
        <span className="block size-[22px] rounded-full bg-white" />
      </button>
    </div>
  );
}
