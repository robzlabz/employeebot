import type { CSSProperties } from "react";
import { Bot, type BotMood } from "@/components/bot";

type BotSpec = {
  accent: string;
  mood: BotMood;
  antenna: boolean;
  bobDelay: number;
  blinkDelay: number;
};

/** Back row — smallest and dimmest, furthest from the viewer. */
const BACK_ROW: BotSpec[] = [
  { accent: "#7dd3fc", mood: "talk", antenna: true, bobDelay: 0, blinkDelay: 0.4 },
  { accent: "#c4b5fd", mood: "smile", antenna: false, bobDelay: 0.7, blinkDelay: 2.1 },
  { accent: "#fcd34d", mood: "grin", antenna: true, bobDelay: 1.4, blinkDelay: 3.4 },
];

const MIDDLE_ROW: BotSpec[] = [
  { accent: "#6ee7b7", mood: "smile", antenna: false, bobDelay: 0.35, blinkDelay: 1.2 },
  { accent: "#f9a8d4", mood: "talk", antenna: false, bobDelay: 1.9, blinkDelay: 4.6 },
  { accent: "#93c5fd", mood: "flat", antenna: true, bobDelay: 2.6, blinkDelay: 0.8 },
];

/** Front row — largest, closest to the viewer. */
const FRONT_ROW: BotSpec[] = [
  { accent: "#fdba74", mood: "grin", antenna: false, bobDelay: 1.1, blinkDelay: 3.1 },
  { accent: "#a5b4fc", mood: "smile", antenna: true, bobDelay: 3.2, blinkDelay: 5.2 },
];

const BUBBLES = [
  {
    text: "Klien minta invoice hari ini",
    position: "left-[1%] top-[6%]",
    delay: 0.4,
  },
  { text: "Sudah, PDF-nya aku kirim", position: "right-[1%] top-[0%]", delay: 4.4 },
  {
    text: "Riset kompetitor 30 menit lagi",
    position: "right-[-1%] bottom-[8%]",
    delay: 8.4,
  },
];

type RowProps = {
  bots: BotSpec[];
  /** Bot width as a share of the cluster width, e.g. `w-[24%]`. */
  botSize: string;
  /** Negative margin that pulls the bots into a huddle. */
  overlap: string;
  className?: string;
  riseDelay: number;
};

function Row({ bots, botSize, overlap, className, riseDelay }: RowProps) {
  return (
    <div
      className={`anim-rise flex items-end justify-center ${className ?? ""}`}
      style={{ "--delay": `${riseDelay}s` } as CSSProperties}
    >
      {bots.map((bot, index) => (
        <Bot
          key={`${bot.accent}-${index}`}
          accent={bot.accent}
          mood={bot.mood}
          antenna={bot.antenna}
          bobDelay={bot.bobDelay}
          blinkDelay={bot.blinkDelay}
          bobDuration={5.2 + index * 0.45}
          blinkDuration={6.2 + index * 0.5}
          className={`${botSize} shrink-0 ${index > 0 ? overlap : ""}`}
        />
      ))}
    </div>
  );
}

/**
 * Eight Employee Bots gathered around a shared workspace, chatting while they
 * work. Pure CSS/SVG — no images, no client JS.
 */
export function BotGathering() {
  return (
    <div
      role="img"
      aria-label="Delapan bot Employee Bot berkumpul dan berdiskusi sambil bekerja"
      className="relative mx-auto w-full max-w-3xl"
    >
      <div
        aria-hidden="true"
        className="anim-glow pointer-events-none absolute inset-x-[18%] bottom-[6%] top-[24%] rounded-[50%] bg-sky-300/10 blur-3xl"
      />

      {BUBBLES.map((bubble) => (
        <span
          key={bubble.text}
          aria-hidden="true"
          className={`anim-bubble pointer-events-none absolute hidden max-w-[9rem] rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs leading-snug text-white/70 backdrop-blur-md md:block lg:max-w-[12rem] ${bubble.position}`}
          style={
            {
              "--dur": "12.8s",
              "--delay": `${bubble.delay}s`,
            } as CSSProperties
          }
        >
          {bubble.text}
        </span>
      ))}

      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center">
        <Row
          bots={BACK_ROW}
          botSize="w-[20%]"
          overlap="-ml-[5%]"
          className="z-0 -ml-[4%] opacity-70"
          riseDelay={0.25}
        />
        <Row
          bots={MIDDLE_ROW}
          botSize="w-[24%]"
          overlap="-ml-[6%]"
          className="z-10 -mt-4 ml-[2%] sm:-mt-6"
          riseDelay={0.35}
        />
        <Row
          bots={FRONT_ROW}
          botSize="w-[28%]"
          overlap="-ml-[7%]"
          className="z-20 -mt-6 ml-[5%] sm:-mt-10"
          riseDelay={0.45}
        />
      </div>
    </div>
  );
}
