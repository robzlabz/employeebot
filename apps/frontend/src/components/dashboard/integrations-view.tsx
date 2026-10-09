import { BotSvg } from "@/components/bolu/bot-svg";
import type { Dashboard } from "./use-dashboard-state";

/** The Integrasi view: search + category filter, connected and available apps. */
export function IntegrationsView({ d }: { d: Dashboard }) {
  return (
    <div className="flex flex-col gap-5 p-[24px_28px_48px] max-[760px]:p-[18px_14px_36px]">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-[36px] font-bold leading-[1.1] max-[760px]:text-[28px]">
            Integrasi
          </h1>
          <div className="text-bolu-muted">
            Sambungkan akun yang dipakai tim Bolu, lalu atur siapa saja yang boleh memakainya.
          </div>
        </div>
        <label className="flex min-h-[46px] flex-[0_1_300px] items-center gap-2 rounded-full border border-bolu-chip bg-white px-4">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5E5B70"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5L21 21" />
          </svg>
          <span className="sr-only">Cari aplikasi</span>
          <input
            type="search"
            value={d.iQuery}
            onChange={(event) => d.onIQuery(event.target.value)}
            placeholder="Cari aplikasi, misalnya Jira"
            className="min-w-0 flex-1 border-0 bg-transparent text-bolu-ink outline-none"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {d.iCats.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={cat.pick}
            aria-pressed={cat.on}
            className={`min-h-10 cursor-pointer rounded-full border-2 px-3.5 text-[14px] font-semibold ${
              cat.on
                ? "border-bolu-ink bg-bolu-ink text-white"
                : "border-bolu-border bg-white text-bolu-ink"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-display text-[22px] font-semibold">Terhubung</h2>
          <span className="text-[14px] text-bolu-muted">{d.connLabel}</span>
        </div>
        {d.noConn ? (
          <div className="py-2 text-bolu-muted">Belum ada aplikasi terhubung di kategori ini.</div>
        ) : null}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-3">
          {d.connected.map((app) => (
            <div
              key={app.id}
              className={`${app.cls} flex flex-col gap-3 rounded-[26px] border border-bolu-border bg-white p-4`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-12 flex-none items-center justify-center rounded-[14px] font-display text-[17px] font-bold text-white"
                  style={{ backgroundColor: app.tile }}
                >
                  {app.mono}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[17px] font-bold">{app.name}</div>
                  <div className="truncate text-[14px] text-bolu-muted">{app.account}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-bolu-lunas">
                  <span className="size-2 rounded-full bg-bolu-live" />
                  Aktif
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[14px] text-bolu-muted">
                <div className="flex">
                  {app.users.map((user, index) => (
                    <BotSvg key={index} bot={user} className="-mr-1.5 size-7" />
                  ))}
                </div>
                <span>Dipakai {app.usersText}</span>
                <span>· {app.permText}</span>
                <span>· sinkron {app.at}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={app.edit}
                  className="min-h-10 cursor-pointer rounded-full border-2 border-bolu-ink bg-white px-4 text-[14px] font-semibold text-bolu-ink"
                >
                  Atur akses
                </button>
                <button
                  type="button"
                  onClick={app.remove}
                  className="min-h-10 cursor-pointer rounded-full border-0 bg-transparent px-4 text-[14px] font-bold text-bolu-belum"
                >
                  Putuskan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-display text-[22px] font-semibold">Tersedia</h2>
          <span className="text-[14px] text-bolu-muted">{d.availLabel}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-3">
          {d.avail.map((app) => (
            <div
              key={app.id}
              className="flex flex-col gap-2.5 rounded-[26px] border border-bolu-border bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-11 flex-none items-center justify-center rounded-[14px] font-display text-[16px] font-bold text-white"
                  style={{ backgroundColor: app.tile }}
                >
                  {app.mono}
                </div>
                <div className="min-w-0">
                  <div className="font-bold">{app.name}</div>
                  <div className="text-[13px] text-bolu-muted">{app.cat}</div>
                </div>
              </div>
              <div className="flex-1 text-[14px] text-bolu-body">{app.desc}</div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex">
                  {app.users.map((user, index) => (
                    <BotSvg key={index} bot={user} className="-mr-1.5 size-7" />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={app.connect}
                  className="min-h-10 cursor-pointer rounded-full border-0 bg-bolu-ink px-4 text-[14px] font-bold text-white"
                >
                  Hubungkan
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-col justify-center gap-2 rounded-[26px] border-2 border-dashed border-bolu-track p-4">
            <div className="font-bold">Aplikasimu belum ada?</div>
            <div className="text-[14px] text-bolu-muted">
              Beri tahu kami aplikasi apa yang kamu pakai, nanti kami kabari kalau sudah bisa
              disambungkan.
            </div>
            <a href="#" className="text-[14px] font-bold">
              Usulkan integrasi
            </a>
          </div>
        </div>
        {d.noAvail ? (
          <div className="text-bolu-muted">Tidak ada aplikasi yang cocok dengan pencarianmu.</div>
        ) : null}
      </div>
    </div>
  );
}
