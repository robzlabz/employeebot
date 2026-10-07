import type { CSSProperties } from "react";

export type BotMood = "smile" | "grin" | "talk" | "flat";

type BotProps = {
  /** Hex accent used for the pupils, mouth and halo. */
  accent: string;
  mood?: BotMood;
  antenna?: boolean;
  /** Seconds. */
  bobDuration?: number;
  bobDelay?: number;
  blinkDuration?: number;
  blinkDelay?: number;
  /** Sizing/layout classes; the SVG keeps a 1:1 aspect ratio. */
  className?: string;
};

function Mouth({ mood, accent }: { mood: BotMood; accent: string }) {
  switch (mood) {
    case "talk":
      return (
        <ellipse cx="60" cy="79" rx="4.2" ry="5.2" fill={accent} fillOpacity="0.9" />
      );
    case "grin":
      return (
        <path
          d="M51 76q9 10 18 0"
          fill="none"
          stroke="#f4f4f5"
          strokeOpacity="0.75"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      );
    case "flat":
      return (
        <path
          d="M54 79h12"
          fill="none"
          stroke="#f4f4f5"
          strokeOpacity="0.7"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      );
    default:
      return (
        <path
          d="M52 77q8 7 16 0"
          fill="none"
          stroke="#f4f4f5"
          strokeOpacity="0.75"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      );
  }
}

/** Cute round character: two eyes, a mouth, optional antenna. Decorative. */
export function Bot({
  accent,
  mood = "smile",
  antenna = false,
  bobDuration = 5.6,
  bobDelay = 0,
  blinkDuration = 6.4,
  blinkDelay = 0,
  className,
}: BotProps) {
  return (
    <div
      className={`anim-bob relative aspect-square ${className ?? ""}`}
      style={
        {
          "--dur": `${bobDuration}s`,
          "--delay": `${bobDelay}s`,
        } as CSSProperties
      }
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-2 bottom-1 top-4 rounded-full blur-2xl"
        style={{ backgroundColor: accent, opacity: 0.16 }}
      />
      <svg
        viewBox="0 0 120 120"
        aria-hidden="true"
        className="relative block h-full w-full"
      >
        {antenna ? (
          <g>
            <path
              d="M60 24V15"
              stroke="#ffffff"
              strokeOpacity="0.25"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              className="anim-pulse"
              cx="60"
              cy="11"
              r="6.5"
              fill={accent}
              fillOpacity="0.22"
              style={{ "--delay": `${blinkDelay}s` } as CSSProperties}
            />
            <circle cx="60" cy="11" r="3.4" fill={accent} />
          </g>
        ) : null}

        <circle
          cx="60"
          cy="62"
          r="40"
          fill="#15151b"
          stroke="#ffffff"
          strokeOpacity="0.12"
        />
        <ellipse cx="60" cy="38" rx="24" ry="12" fill="#ffffff" fillOpacity="0.05" />

        <g
          className="anim-blink"
          style={
            {
              "--dur": `${blinkDuration}s`,
              "--delay": `${blinkDelay}s`,
            } as CSSProperties
          }
        >
          <ellipse cx="47" cy="56" rx="6.6" ry="7.6" fill="#f4f4f5" />
          <ellipse cx="73" cy="56" rx="6.6" ry="7.6" fill="#f4f4f5" />
          <g
            className="anim-glance"
            style={
              {
                "--dur": `${blinkDuration + 2.6}s`,
                "--delay": `${blinkDelay}s`,
              } as CSSProperties
            }
          >
            <circle cx="47" cy="57" r="3.2" fill={accent} />
            <circle cx="73" cy="57" r="3.2" fill={accent} />
          </g>
        </g>

        <Mouth mood={mood} accent={accent} />
      </svg>
    </div>
  );
}
