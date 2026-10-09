import Link from "next/link";
import { BotSvg } from "@/components/bolu/bot-svg";
import { LANGS, TZONES } from "./settings";
import type { Dashboard, ToggleRow } from "./use-dashboard-state";

/** The Pengaturan view: workspace, hours, approvals, tone, apps, notifications. */
export function SettingsView({ d }: { d: Dashboard }) {
  const set = d.set;
  return (
    <div className="flex max-w-[900px] flex-col gap-[18px] p-[24px_28px_48px] max-[760px]:p-[18px_14px_36px]">
      <div>
        <h1 className="font-display text-[36px] font-bold leading-[1.1] max-[760px]:text-[28px]">
          Pengaturan
        </h1>
        <div className="text-bolu-muted">Atur cara tim Bolu bekerja untukmu. Perubahan langsung tersimpan.</div>
      </div>

      <section className="flex flex-col gap-3.5 rounded-[26px] border border-bolu-border bg-white p-[22px]">
        <h2 className="font-display text-[22px] font-semibold">Ruang kerja</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
          <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
            Nama ruang kerja
            <input
              type="text"
              value={set.ws}
              onChange={(event) => set.onWs(event.target.value)}
              className="min-h-[46px] rounded-[14px] border border-bolu-chip px-3.5 font-normal text-bolu-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
            Zona waktu
            <select
              value={set.tz}
              onChange={(event) => set.onTz(event.target.value)}
              className="min-h-[46px] rounded-[14px] border border-bolu-chip bg-white px-3.5 font-normal text-bolu-ink"
            >
              {TZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
            Bahasa balasan
            <select
              value={set.lang}
              onChange={(event) => set.onLang(event.target.value)}
              className="min-h-[46px] rounded-[14px] border border-bolu-chip bg-white px-3.5 font-normal text-bolu-ink"
            >
              {LANGS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3.5 rounded-[26px] border border-bolu-border bg-white p-[22px]">
        <h2 className="font-display text-[22px] font-semibold">Jam kerja tim</h2>
        <div className="text-[15px] text-bolu-muted">
          Di luar jam ini Bolu tidak menghubungi pelanggan. Pekerjaan dalam seperti rekap dan arsip
          tetap jalan.
        </div>
        <div className="flex flex-wrap items-end gap-3.5">
          <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
            Mulai
            <input
              type="time"
              value={set.start}
              onChange={(event) => set.onStart(event.target.value)}
              className="min-h-[46px] rounded-[14px] border border-bolu-chip px-3.5 font-normal text-bolu-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
            Selesai
            <input
              type="time"
              value={set.end}
              onChange={(event) => set.onEnd(event.target.value)}
              className="min-h-[46px] rounded-[14px] border border-bolu-chip px-3.5 font-normal text-bolu-ink"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {set.days.map((day) => (
              <button
                key={day.label}
                type="button"
                onClick={day.pick}
                aria-pressed={day.on}
                className={`min-h-11 cursor-pointer rounded-full border-2 px-3 text-[14px] font-semibold ${
                  day.on
                    ? "border-bolu-ink bg-bolu-ink text-white"
                    : "border-bolu-border bg-white text-bolu-ink"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-1 rounded-[26px] border border-bolu-border bg-white px-[22px] pb-2.5 pt-[22px]">
        <h2 className="font-display text-[22px] font-semibold">Persetujuan</h2>
        <div className="mb-2 text-[15px] text-bolu-muted">
          Pilih mana yang boleh langsung dikirim Bolu tanpa menunggu kamu. Yang dimatikan selalu
          masuk sebagai draf.
        </div>
        {set.auto.map((row) => (
          <ToggleRowView key={row.key} row={row} withBot />
        ))}
      </section>

      <section className="flex flex-col gap-3.5 rounded-[26px] border border-bolu-border bg-white p-[22px]">
        <h2 className="font-display text-[22px] font-semibold">Gaya bahasa</h2>
        <div className="flex flex-wrap gap-2">
          {set.tones.map((tone) => (
            <button
              key={tone.label}
              type="button"
              onClick={tone.pick}
              aria-pressed={tone.on}
              className={`min-h-11 cursor-pointer rounded-full border-2 px-4 text-[14px] font-semibold ${
                tone.on
                  ? "border-bolu-ink bg-bolu-ink text-white"
                  : "border-bolu-border bg-white text-bolu-ink"
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2.5">
          <BotSvg bot={set.toneBot} className="size-[38px] flex-none" />
          <div className="rounded-[6px_20px_20px_20px] bg-[#DCEEFD] p-[11px_16px] text-[15px]">
            {set.toneSample}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3.5 rounded-[26px] border border-bolu-border bg-white p-[22px]">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[22px] font-semibold">Aplikasi terhubung</h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex">
              {set.connTiles.map((tile) => (
                <span
                  key={tile.id}
                  className="-mr-1.5 box-border flex size-[30px] items-center justify-center rounded-[9px] border-2 border-white font-display text-[12px] font-bold text-white"
                  style={{ backgroundColor: tile.tile }}
                >
                  {tile.mono}
                </span>
              ))}
            </div>
            <span className="text-[14px] text-bolu-muted">{set.connText}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={d.openInteg}
          className="min-h-11 cursor-pointer rounded-full border-0 bg-bolu-ink px-5 font-bold text-white"
        >
          Kelola integrasi
        </button>
      </section>

      <section className="flex flex-col gap-1 rounded-[26px] border border-bolu-border bg-white px-[22px] pb-2.5 pt-[22px]">
        <h2 className="font-display text-[22px] font-semibold">Notifikasi</h2>
        {set.notif.map((row) => (
          <ToggleRowView key={row.key} row={row} />
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3.5 rounded-[26px] border border-bolu-border bg-white p-[22px]">
        <div>
          <h2 className="font-display text-[22px] font-semibold">Paket dan tagihan</h2>
          <div className="text-bolu-muted">Paket Coba · [SISA MASA COBA]</div>
        </div>
        <Link
          href="/pricing"
          className="inline-flex min-h-11 items-center rounded-full bg-bolu-ink px-5 font-bold text-white no-underline hover:text-white"
        >
          Lihat paket
        </Link>
      </section>
    </div>
  );
}

function ToggleRowView({ row, withBot = false }: { row: ToggleRow; withBot?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 border-t border-bolu-line py-3">
      {withBot && row.bot ? <BotSvg bot={row.bot} className="size-10 flex-none" /> : null}
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{row.title}</div>
        <div className="text-[14px] text-bolu-muted">{row.desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={row.on}
        aria-label={row.title}
        onClick={row.toggle}
        className="flex h-7 w-12 flex-none cursor-pointer rounded-full border-0 p-[3px]"
        style={{
          backgroundColor: row.on ? "#1E1B2E" : "#C9CDE0",
          justifyContent: row.on ? "flex-end" : "flex-start",
        }}
      >
        <span className="block size-[22px] rounded-full bg-white" />
      </button>
    </div>
  );
}
