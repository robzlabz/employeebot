import type { CSSProperties } from "react";
import type { BotShape } from "@/lib/crew";

type BotSvgProps = {
  bot: BotShape;
  /** Wrapper sizing/animation classes, e.g. `bob size-26`. */
  className?: string;
  /** Extra wrapper styles; `animationDelay` drives bob/blink/glance. */
  style?: CSSProperties;
};

/**
 * The Keluarga Bolu character: body path + feet + face (cheeks, blinking eyes,
 * glancing pupils, mouth). Ported 1:1 from the design's `mk()` renderer.
 * Decorative — the surrounding copy carries the meaning.
 */
export function BotSvg({ bot, className, style }: BotSvgProps) {
  return (
    <div className={className} style={style}>
      <svg
        viewBox="0 0 200 200"
        aria-hidden="true"
        className="block size-full overflow-visible"
      >
        {bot.hasFeet ? <path d={bot.feet} fill={bot.feetColor} /> : null}
        <path
          d={bot.d}
          fill={bot.color}
          stroke={bot.color}
          strokeWidth={bot.sw}
          strokeLinejoin="round"
        />
        <g transform={bot.face}>
          <ellipse cx="-31" cy="9" rx="11" ry="6.5" fill="#FF5A86" opacity="0.3" />
          <ellipse cx="31" cy="9" rx="11" ry="6.5" fill="#FF5A86" opacity="0.3" />
          {bot.eyesClosed ? (
            <path
              d="M-26 -6 Q-17 1 -8 -6 M8 -6 Q17 1 26 -6"
              fill="none"
              stroke="#1E1B2E"
              strokeWidth={4.5}
              strokeLinecap="round"
            />
          ) : (
            <g className="blink" style={{ animationDelay: bot.delay }}>
              <ellipse cx="-17" cy="-8" rx="10.5" ry="11.5" fill="#FFFFFF" />
              <ellipse cx="17" cy="-8" rx="10.5" ry="11.5" fill="#FFFFFF" />
              <g className="glance" style={{ animationDelay: bot.delay }}>
                <g transform={bot.look}>
                  <circle cx="-17" cy="-7" r="7" fill="#1E1B2E" />
                  <circle cx="17" cy="-7" r="7" fill="#1E1B2E" />
                  <circle cx="-14.2" cy="-10.2" r="2.9" fill="#FFFFFF" />
                  <circle cx="19.8" cy="-10.2" r="2.9" fill="#FFFFFF" />
                  <circle cx="-19.9" cy="-4.2" r="1.4" fill="#FFFFFF" />
                  <circle cx="14.1" cy="-4.2" r="1.4" fill="#FFFFFF" />
                </g>
              </g>
            </g>
          )}
          <path
            d={bot.mouth}
            fill={bot.mouthFill}
            stroke="#1E1B2E"
            strokeWidth={bot.mouthSw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
