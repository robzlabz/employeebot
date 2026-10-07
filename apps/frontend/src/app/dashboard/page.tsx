import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Bot } from "@/components/bot";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard Employee Bot — segera hadir.",
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="eb-grid pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="eb-spotlight pointer-events-none absolute inset-0"
        />

        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-6 sm:py-28">
          <Bot accent="#7dd3fc" antenna mood="smile" className="w-24 sm:w-28" />

          <span className="anim-rise mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/60">
            <span className="anim-pulse size-1.5 rounded-full bg-amber-300" />
            Dalam pengembangan
          </span>

          <h1
            className="anim-rise mt-6 text-3xl font-medium tracking-tight text-white sm:text-4xl"
            style={{ "--delay": "0.08s" } as CSSProperties}
          >
            Dashboard coming soon
          </h1>

          <p
            className="anim-rise mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base"
            style={{ "--delay": "0.16s" } as CSSProperties}
          >
            Login, onboarding perusahaan, dan manajemen bot sedang dibangun. Setelah
            rilis, di sini kamu bisa membuat company, menambah bot, dan mengatur
            workspace bersama.
          </p>

          <div
            className="anim-rise mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
            style={{ "--delay": "0.24s" } as CSSProperties}
          >
            <Link
              href="/"
              className="w-full rounded-full bg-white px-6 py-3 text-center text-sm font-medium text-black transition-colors hover:bg-white/90 sm:w-auto"
            >
              Kembali ke home
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-full border border-white/15 px-6 py-3 text-center text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white sm:w-auto"
            >
              Lihat Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
