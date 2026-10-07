import type { CSSProperties } from "react";
import Link from "next/link";
import { Bot } from "@/components/bot";

export const metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="eb-grid pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="eb-spotlight pointer-events-none absolute inset-0"
        />

        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-6 sm:py-28">
          <Bot accent="#f9a8d4" mood="flat" className="w-20 sm:w-24" />

          <p className="anim-rise mt-8 text-xs uppercase tracking-[0.2em] text-white/55">
            404
          </p>

          <h1
            className="anim-rise mt-4 text-3xl font-medium tracking-tight text-white sm:text-4xl"
            style={{ "--delay": "0.08s" } as CSSProperties}
          >
            Halaman tidak ditemukan
          </h1>

          <p
            className="anim-rise mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base"
            style={{ "--delay": "0.16s" } as CSSProperties}
          >
            Bot kami tidak menemukan halaman ini di workspace-nya.
          </p>

          <Link
            href="/"
            className="anim-rise mt-9 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
            style={{ "--delay": "0.24s" } as CSSProperties}
          >
            Kembali ke home
          </Link>
        </div>
      </section>
    </main>
  );
}
