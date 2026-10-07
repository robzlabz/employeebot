import type { CSSProperties } from "react";
import Link from "next/link";
import { BotGathering } from "@/components/bot-gathering";
import { FeatureGrid } from "@/components/feature-grid";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="eb-grid pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="eb-spotlight pointer-events-none absolute inset-0"
        />

        <div className="relative mx-auto w-full max-w-6xl px-5 pt-16 sm:px-6 sm:pt-24">
          <div className="anim-rise flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/60">
              <span className="anim-pulse size-1.5 rounded-full bg-emerald-400" />
              Dibangun untuk bisnis Indonesia
            </span>

            <h1 className="mt-7 max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight text-white text-balance sm:text-5xl md:text-6xl">
              Bot yang mengerjakan pekerjaan manusia.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
              Setiap bot punya komputer virtual, terminal, browser, dan memori jangka
              panjang — dengan sesi yang tidak pernah berhenti. Satu perusahaan bisa
              punya banyak bot yang bekerja dalam tim, berbagi workspace, dan belajar
              dari cara kerja kamu.
            </p>

            <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/dashboard"
                className="w-full rounded-full bg-white px-6 py-3 text-center text-sm font-medium text-black transition-colors hover:bg-white/90 sm:w-auto"
              >
                Mulai
              </Link>
              <Link
                href="/pricing"
                className="w-full rounded-full border border-white/15 px-6 py-3 text-center text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white sm:w-auto"
              >
                Lihat Pricing
              </Link>
            </div>

            <p className="mt-5 text-xs text-white/55">
              Billing via transfer bank Indonesia. Tanpa kartu kredit, tanpa Stripe.
            </p>
          </div>

          <div
            className="anim-rise pb-6 pt-4 sm:pt-8"
            style={{ "--delay": "0.18s" } as CSSProperties}
          >
            <BotGathering />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-24 pt-8 sm:px-6 sm:pt-12">
        <FeatureGrid />
      </section>
    </main>
  );
}
