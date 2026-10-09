import { BotSvg } from "@/components/bolu/bot-svg";
import type { ModalModel } from "./use-dashboard-state";

/** The connect / manage-access dialog used by the Integrasi view. */
export function IntegrationsModal({ md }: { md: ModalModel }) {
  return (
    <div className="fixed inset-0 z-20 box-border flex items-center justify-center bg-[rgba(30,27,46,0.45)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mtitle"
        className="pop box-border flex max-h-[calc(100%-32px)] w-full max-w-[520px] flex-col gap-[18px] overflow-y-auto rounded-[28px] bg-white p-6 text-bolu-ink"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex size-12 flex-none items-center justify-center rounded-[14px] font-display text-[17px] font-bold text-white"
            style={{ backgroundColor: md.tile }}
          >
            {md.mono}
          </div>
          <div className="min-w-0 flex-1">
            <div id="mtitle" className="font-display text-[22px] font-bold leading-[1.2]">
              {md.title}
            </div>
            <div className="text-[14px] text-bolu-muted">{md.desc}</div>
          </div>
          <button
            type="button"
            onClick={md.close}
            aria-label="Tutup"
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-bolu-bg"
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

        {md.isForm ? (
          <div className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-1.5 text-[14px] font-bold">
              Akun
              <input
                type="text"
                value={md.account}
                onChange={(event) => md.onAccount(event.target.value)}
                placeholder={md.accHint}
                className="min-h-[46px] rounded-[14px] border border-bolu-chip px-3.5 font-normal text-bolu-ink"
              />
            </label>

            <div className="flex flex-col gap-2">
              <div className="text-[14px] font-bold">Bolu yang boleh memakai</div>
              <div className="flex flex-wrap gap-2">
                {md.bots.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={item.pick}
                    aria-pressed={item.on}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 py-0 pl-2 pr-3.5 text-[14px] font-semibold ${
                      item.on
                        ? "border-bolu-ink bg-bolu-ink text-white"
                        : "border-bolu-border bg-white text-bolu-ink"
                    }`}
                  >
                    <BotSvg bot={item.bot} className="size-[26px]" />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[14px] font-bold">Izin</div>
              <div className="flex flex-wrap gap-2">
                {md.perms.map((perm) => (
                  <button
                    key={perm.label}
                    type="button"
                    onClick={perm.pick}
                    aria-pressed={perm.on}
                    className={`flex cursor-pointer flex-col items-start gap-0 rounded-full border-2 px-4 py-2 text-[14px] font-semibold ${
                      perm.on
                        ? "border-bolu-ink bg-bolu-ink text-white"
                        : "border-bolu-border bg-white text-bolu-ink"
                    }`}
                  >
                    <span className="font-bold">{perm.label}</span>
                    <span className="text-[13px] opacity-80">{perm.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {md.hasError ? (
              <div role="alert" className="text-[14px] font-semibold text-bolu-belum">
                {md.error}
              </div>
            ) : null}
            <div className="text-[13px] text-bolu-muted">{md.note}</div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={md.close}
                className="min-h-11 cursor-pointer rounded-full border-2 border-bolu-ink bg-white px-4 font-semibold text-bolu-ink"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={md.submit}
                className="min-h-11 cursor-pointer rounded-full border-0 bg-bolu-ink px-4 font-bold text-white"
              >
                {md.cta}
              </button>
            </div>
          </div>
        ) : null}

        {md.isBusy ? (
          <div className="flex flex-col items-center gap-3 py-5 text-center">
            <BotSvg bot={md.helper} className="bob size-[84px]" />
            <div className="font-bold">
              Menghubungkan ke {md.name}
              <span className="dots ml-2">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        ) : null}

        {md.isDone ? (
          <div className="flex flex-col items-center gap-3 py-3 text-center">
            <BotSvg bot={md.helper} className="bob size-[84px]" />
            <div className="font-display text-[22px] font-bold">{md.doneTitle}</div>
            <div className="max-w-[360px] text-bolu-muted">{md.doneText}</div>
            <button
              type="button"
              onClick={md.close}
              className="min-h-11 cursor-pointer rounded-full border-0 bg-bolu-ink px-4 font-bold text-white"
            >
              Selesai
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
