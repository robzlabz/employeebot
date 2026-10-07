import type { Metadata } from "next";
import Link from "next/link";
import { BotSvg } from "@/components/bolu/bot-svg";
import { SiteFooter } from "@/components/bolu/site-footer";
import { SiteNav } from "@/components/bolu/site-nav";
import { bot } from "@/lib/crew";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard Keluarga Bolu — segera hadir.",
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-[720px] flex-col items-center px-6 py-24 text-center">
          <BotSvg bot={bot("Lila")} className="bob size-28" />

          <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-bolu-border bg-white px-3.5 py-1.5 text-sm text-bolu-muted">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#FFC21A]" />
            Dalam pengembangan
          </span>

          <h1 className="mt-6 font-display text-[clamp(32px,4.4vw,44px)] font-bold leading-[1.08]">
            Ruang kerja sedang disiapkan
          </h1>

          <p className="mt-5 max-w-[560px] text-bolu-muted">
            Login, pendaftaran bisnis, dan pengaturan anggota tim sedang dibangun. Setelah
            rilis, di sini kamu bisa mengatur pekerjaan tiap anggota keluarga Bolu.
          </p>

          <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/"
              className="w-full rounded-full bg-bolu-ink px-6 py-3 text-center font-semibold text-white no-underline hover:text-white sm:w-auto"
            >
              Kembali ke beranda
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-full border-2 border-bolu-ink px-6 py-3 text-center font-semibold text-bolu-ink no-underline hover:text-bolu-ink sm:w-auto"
            >
              Lihat harga
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
