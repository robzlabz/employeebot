import { BotSvg } from "@/components/bolu/bot-svg";
import type { BotController, DraftCard as DraftCardData } from "./use-dashboard-state";

/** One bot's chat: header switch, bio + starter chips, thread with draft cards, right rail. */
export function ChatView({ d }: { d: BotController }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-bolu-border bg-white p-[14px_28px]">
        <BotSvg bot={d.cur.face} className="size-10 flex-none" />
        <div className="min-w-0 flex-[1_1_200px]">
          <div className="font-display text-[20px] font-semibold leading-[1.2]">{d.cur.name}</div>
          <div className="text-[14px] font-semibold" style={{ color: d.cur.statusColor }}>
            {d.cur.status}
          </div>
        </div>
        <span className="text-[14px] text-bolu-muted">{d.cur.toggleText}</span>
        <button
          type="button"
          role="switch"
          aria-checked={!d.cur.off}
          aria-label={d.cur.toggleLabel}
          onClick={d.cur.toggle}
          className="flex h-[30px] w-[52px] flex-none cursor-pointer rounded-full border-0 p-[3px]"
          style={{ backgroundColor: d.cur.trackColor, justifyContent: d.cur.knobSide }}
        >
          <span className="block size-6 rounded-full bg-white" />
        </button>
      </div>

      <div className="flex flex-1 flex-wrap items-start gap-6 p-[24px_28px_32px]">
        <div className="mx-auto flex min-w-0 max-w-[780px] flex-[999_1_520px] flex-col gap-[18px]">
          <div className="flex flex-col items-center gap-2 p-[12px_0_8px] text-center">
            <div
              className="flex size-[168px] items-center justify-center rounded-full"
              style={{ backgroundColor: d.cur.tint }}
            >
              <BotSvg
                bot={d.big}
                className={d.cur.anim ? `${d.cur.anim} size-32` : "size-32"}
                style={{ animationDelay: d.big.delay }}
              />
            </div>
            <div className="font-display text-[32px] font-bold leading-[1.1]">{d.cur.name}</div>
            <div className="max-w-[460px] text-bolu-muted">{d.cur.bio}</div>
            <div className="mt-1.5 flex flex-wrap justify-center gap-2">
              {d.chips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.pick}
                  className="min-h-10 cursor-pointer rounded-full border border-bolu-chip bg-white px-4 text-[14px] font-semibold text-bolu-ink"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            {d.thread.map((msg) => (
              <div key={msg.key} className={msg.cls}>
                {msg.mine ? (
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-[20px_20px_6px_20px] bg-bolu-ink p-[11px_16px] text-[15px] text-white">
                      {msg.text}
                    </div>
                  </div>
                ) : null}
                {msg.theirs ? (
                  <div className="flex items-start gap-2.5">
                    <BotSvg bot={d.cur.face} className="mt-0.5 size-[34px] flex-none" />
                    <div className="flex min-w-0 max-w-[560px] flex-1 flex-col gap-2.5">
                      <div
                        className="self-start rounded-[6px_20px_20px_20px] p-[11px_16px] text-[15px]"
                        style={{ backgroundColor: d.cur.tint }}
                      >
                        {msg.text}
                      </div>
                      {msg.hasDraft && msg.card ? <DraftCard card={msg.card} /> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {d.isTyping ? (
              <div className="pop flex items-center gap-2.5">
                <BotSvg bot={d.cur.face} className="size-[34px] flex-none" />
                <div
                  className="rounded-[6px_20px_20px_20px] p-[14px_16px]"
                  style={{ backgroundColor: d.cur.tint }}
                >
                  <span className="dots">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-2 rounded-[28px] border border-bolu-chip bg-white p-[6px_6px_6px_20px]">
            <label htmlFor="pesan" className="sr-only">
              Pesan untuk {d.cur.name}
            </label>
            <input
              id="pesan"
              type="text"
              value={d.chatMsg}
              onChange={(event) => d.setChatMsg(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") d.sendChat();
              }}
              placeholder={d.placeholder}
              className="min-h-[46px] min-w-0 flex-1 border-0 bg-transparent text-bolu-ink outline-none"
            />
            <button
              type="button"
              aria-label="Kirim pesan"
              onClick={d.sendChat}
              className="flex size-[46px] flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-bolu-accent"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5">
          <div className="flex flex-col gap-2.5 rounded-[26px] border border-bolu-border bg-white p-[18px]">
            <div className="font-display text-[18px] font-semibold">Hari ini</div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-[14px] bg-bolu-bg p-[10px_12px]">
                <div className="font-display text-[26px] font-bold">{d.cur.doneToday}</div>
                <div className="text-[13px] text-bolu-muted">tugas selesai</div>
              </div>
              <div className="rounded-[14px] bg-bolu-bg p-[10px_12px]">
                <div className="font-display text-[26px] font-bold">{d.cur.pendingN}</div>
                <div className="text-[13px] text-bolu-muted">menunggu kamu</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 rounded-[26px] border border-bolu-border bg-white p-[18px]">
            <div className="font-display text-[18px] font-semibold">
              Yang dikerjakan {d.cur.name}
            </div>
            {d.cur.skills.map((skill) => (
              <div key={skill} className="flex items-start gap-2.5 text-[15px]">
                <span
                  className="mt-2 size-2 flex-none rounded-full"
                  style={{ backgroundColor: d.cur.color }}
                />
                <span>{skill}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-[26px] border border-bolu-border bg-white p-[18px]">
            <div className="font-display text-[18px] font-semibold">Kerja bareng</div>
            <div className="text-[15px] text-bolu-muted">{d.cur.team}</div>
            <div className="mt-1 flex gap-1">
              {d.cur.mates.map((mate) => (
                <button
                  key={mate.name}
                  type="button"
                  onClick={mate.pick}
                  aria-label={`Buka obrolan ${mate.name}`}
                  className="size-11 cursor-pointer border-0 bg-transparent p-0"
                >
                  <BotSvg bot={mate.face} className="size-11" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftCard({ card }: { card: DraftCardData }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-bolu-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="text-[13px] font-bold text-bolu-muted">{card.kind}</span>
        <span className="font-display text-[17px] font-semibold">{card.title}</span>
      </div>
      <div className="flex flex-col">
        {card.fields.map((field) => (
          <div
            key={field.k}
            className="flex justify-between gap-3 border-t border-bolu-line p-[7px_0] text-[14px]"
          >
            <span className="text-bolu-muted">{field.k}</span>
            <span className="text-right font-semibold">{field.v}</span>
          </div>
        ))}
      </div>
      <div
        className="whitespace-pre-line rounded-[14px] p-[12px_14px] text-[15px]"
        style={{ backgroundColor: card.tint }}
      >
        {card.draft}
      </div>
      {card.isPending ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={card.approve}
            className="min-h-11 flex-[1_1_140px] cursor-pointer rounded-full border-0 bg-bolu-ink font-bold text-white"
          >
            {card.cta}
          </button>
          <button
            type="button"
            onClick={card.reject}
            className="min-h-11 flex-[1_1_120px] cursor-pointer rounded-full border-2 border-bolu-ink bg-white font-semibold text-bolu-ink"
          >
            Minta diubah
          </button>
        </div>
      ) : null}
      {card.isDone ? (
        <div
          className="inline-flex items-center gap-2 self-start rounded-full p-[6px_14px_6px_8px] text-[14px] font-bold text-white"
          style={{ backgroundColor: card.doneBg }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          {card.doneLabel}
        </div>
      ) : null}
    </div>
  );
}
