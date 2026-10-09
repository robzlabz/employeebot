import { BotSvg } from "@/components/bolu/bot-svg";
import { ACCENT, type Dashboard, type DraftCard as DraftCardData } from "./use-dashboard-state";

/** One bot's or one group's chat: header, bio + chips, thread, and the right rail. */
export function ChatView({ d }: { d: Dashboard }) {
  const c = d.chat;
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-bolu-border bg-white p-[14px_28px] max-[760px]:p-[10px_14px]">
        {c.isOne ? <BotSvg bot={c.face} className="size-10 flex-none" /> : null}
        {c.isGroup ? (
          <div className="flex flex-none">
            {c.members.map((member) => (
              <div
                key={member.name}
                className="-mr-2.5 box-border size-[38px] rounded-full bg-white p-0.5"
              >
                <BotSvg bot={member.bot} className="size-full" />
              </div>
            ))}
          </div>
        ) : null}
        <div className="ml-1.5 min-w-0 flex-[1_1_200px]">
          <div className="font-display text-[20px] font-semibold leading-[1.2]">{c.title}</div>
          <div className="text-[14px] font-semibold" style={{ color: c.subColor }}>
            {c.sub}
          </div>
        </div>
        {c.isOne ? (
          <div className="flex items-center gap-2.5">
            <span className="text-[14px] text-bolu-muted">{c.toggleText}</span>
            <button
              type="button"
              role="switch"
              aria-checked={!c.off}
              aria-label={c.toggleLabel}
              onClick={c.toggle}
              className="flex h-[30px] w-[52px] flex-none cursor-pointer rounded-full border-0 p-[3px]"
              style={{
                backgroundColor: c.off ? "#C9CDE0" : "#1E1B2E",
                justifyContent: c.off ? "flex-start" : "flex-end",
              }}
            >
              <span className="block size-6 rounded-full bg-white" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-wrap items-start gap-6 p-[24px_28px_32px] max-[760px]:p-[16px_14px_28px]">
        <div className="mx-auto flex min-w-0 max-w-[780px] flex-[999_1_520px] flex-col gap-[18px]">
          <div className="flex flex-col items-center gap-2 p-[12px_0_8px] text-center">
            {c.isOne ? (
              <div
                className="flex size-[168px] items-center justify-center rounded-full max-[760px]:size-[132px]"
                style={{ backgroundColor: c.tint }}
              >
                <BotSvg
                  bot={c.big}
                  className={`size-32 max-[760px]:size-[100px] ${c.anim}`}
                  style={{ animationDelay: c.big.delay }}
                />
              </div>
            ) : null}
            {c.isGroup ? (
              <div className="flex items-end justify-center gap-1.5 rounded-full bg-bolu-line px-7 pb-3.5 pt-[18px]">
                {c.members.map((member) => (
                  <BotSvg
                    key={member.name}
                    bot={member.bot}
                    className={`size-[92px] max-[760px]:size-[60px] ${member.anim}`}
                    style={{ animationDelay: member.bot.delay }}
                  />
                ))}
              </div>
            ) : null}
            <div className="font-display text-[32px] font-bold leading-[1.1]">{c.title}</div>
            <div className="max-w-[480px] text-bolu-muted">{c.bio}</div>
            <div className="mt-1.5 flex flex-wrap justify-center gap-2">
              {c.chips.map((chip) => (
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
            {c.thread.map((msg) => (
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
                    <BotSvg bot={msg.bot} className="mt-0.5 size-9 flex-none" />
                    <div className="flex min-w-0 max-w-[560px] flex-1 flex-col gap-1.5">
                      {msg.showName ? (
                        <span className="text-[13px] font-bold text-bolu-body">{msg.name}</span>
                      ) : null}
                      <div
                        className="self-start rounded-[6px_20px_20px_20px] p-[11px_16px] text-[15px]"
                        style={{ backgroundColor: msg.tint }}
                      >
                        {msg.text}
                      </div>
                      {msg.hasDraft && msg.card ? <DraftCard card={msg.card} /> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {c.typingBots.map((tb) => (
              <div key={tb.key} className="pop flex items-center gap-2.5">
                <BotSvg bot={tb.bot} className="size-9 flex-none" />
                <div
                  className="flex items-center gap-2 rounded-[6px_20px_20px_20px] p-[12px_16px]"
                  style={{ backgroundColor: tb.tint }}
                >
                  <span className="text-[13px] font-bold">{tb.name}</span>
                  <span className="dots">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-1 flex items-center gap-2 rounded-[28px] border border-bolu-chip bg-white p-[6px_6px_6px_20px]">
            <label htmlFor="pesan" className="sr-only">
              Pesan
            </label>
            <input
              id="pesan"
              type="text"
              value={c.chatMsg}
              onChange={(event) => c.setChatMsg(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") c.sendChat();
              }}
              placeholder={c.placeholder}
              className="min-h-[46px] min-w-0 flex-1 border-0 bg-transparent text-bolu-ink outline-none"
            />
            <button
              type="button"
              aria-label="Kirim pesan"
              onClick={c.sendChat}
              className="flex size-[46px] flex-none cursor-pointer items-center justify-center rounded-full border-0"
              style={{ backgroundColor: ACCENT }}
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
          {c.isOne ? (
            <>
              <div className="flex flex-col gap-2.5 rounded-[26px] border border-bolu-border bg-white p-[18px]">
                <div className="font-display text-[18px] font-semibold">Hari ini</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-[14px] bg-bolu-bg p-[10px_12px]">
                    <div className="font-display text-[26px] font-bold">{c.doneToday}</div>
                    <div className="text-[13px] text-bolu-muted">tugas selesai</div>
                  </div>
                  <div className="rounded-[14px] bg-bolu-bg p-[10px_12px]">
                    <div className="font-display text-[26px] font-bold">{c.pendingN}</div>
                    <div className="text-[13px] text-bolu-muted">menunggu kamu</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 rounded-[26px] border border-bolu-border bg-white p-[18px]">
                <div className="font-display text-[18px] font-semibold">
                  Yang dikerjakan {c.title}
                </div>
                {c.skills.map((skill) => (
                  <div key={skill} className="flex items-start gap-2.5 text-[15px]">
                    <span
                      className="mt-2 size-2 flex-none rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 rounded-[26px] border border-bolu-border bg-white p-[18px]">
                <div className="font-display text-[18px] font-semibold">Rutinitas {c.title}</div>
                {c.routines.map((routine) => (
                  <div key={`${routine.time}-${routine.title}`} className="flex gap-2.5 text-[14px]">
                    <span className="w-16 flex-none font-bold">{routine.time}</span>
                    <span>{routine.title}</span>
                  </div>
                ))}
                {c.noRoutine ? (
                  <div className="text-[14px] text-bolu-muted">Belum ada rutinitas.</div>
                ) : null}
              </div>
            </>
          ) : null}

          {c.isGroup ? (
            <div className="flex flex-col gap-2.5 rounded-[26px] border border-bolu-border bg-white p-[18px]">
              <div className="font-display text-[18px] font-semibold">Anggota grup</div>
              {c.members.map((member) => (
                <button
                  key={member.name}
                  type="button"
                  onClick={member.pick}
                  className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-bolu-line bg-white p-2 text-left text-bolu-ink"
                >
                  <BotSvg bot={member.bot} className="size-10 flex-none" />
                  <div className="min-w-0">
                    <div className="font-bold">{member.name}</div>
                    <div className="text-[13px] text-bolu-muted">
                      {member.role} ·{" "}
                      <span className="font-semibold" style={{ color: member.statusColor }}>
                        {member.line}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
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
