import type { CSSProperties } from "react";
import Link from "next/link";

type Tier = {
  name: string;
  price: string;
  period?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href?: string };
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "Rp 0",
    period: "/ bulan",
    tagline: "Untuk mencoba Employee Bot.",
    features: [
      "1 perusahaan",
      "1 bot + 1 virtual computer",
      "Memori personal",
      "Workspace dasar",
    ],
    cta: { label: "Mulai", href: "/dashboard" },
  },
  {
    name: "Pro",
    price: "Segera",
    tagline: "Untuk bisnis yang sudah jalan.",
    features: [
      "Banyak bot per perusahaan",
      "Grup bot + shared workspace",
      "Secrets & environment",
      "Sesi persisten prioritas",
    ],
    cta: { label: "Coming soon" },
    featured: true,
  },
  {
    name: "Team",
    price: "Custom",
    tagline: "Untuk tim dan agensi.",
    features: [
      "Bot sesuai kebutuhan",
      "Akses tim & peran",
      "Audit log aktivitas",
      "Dukungan prioritas",
    ],
    cta: { label: "Hubungi kami", href: "/dashboard" },
  },
];

export const metadata = {
  title: "Pricing",
  description:
    "Harga Employee Bot: mulai gratis, bayar lewat transfer bank Indonesia saat upgrade. Tanpa Stripe.",
};

export default function PricingPage() {
  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="eb-grid pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="eb-spotlight pointer-events-none absolute inset-0"
        />

        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <div className="anim-rise mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-medium tracking-tight text-white sm:text-5xl">
              Pricing
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
              Mulai gratis dengan satu bot. Upgrade saat tim kamu siap — bayar
              dengan transfer bank Indonesia.
            </p>
          </div>

          <ul className="anim-rise mt-14 grid gap-4 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <li
                key={tier.name}
                className={`flex flex-col rounded-3xl border p-7 ${
                  tier.featured
                    ? "border-white/20 bg-white/[0.04]"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-medium text-white">{tier.name}</h2>
                  {tier.featured ? (
                    <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/60">
                      Segera
                    </span>
                  ) : null}
                </div>

                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-3xl font-medium tracking-tight text-white">
                    {tier.price}
                  </span>
                  {tier.period ? (
                    <span className="text-sm text-white/55">{tier.period}</span>
                  ) : null}
                </p>

                <p className="mt-3 text-sm text-white/50">{tier.tagline}</p>

                <ul className="mt-7 flex-1 space-y-3 text-sm text-white/60">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-white/45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {tier.cta.href ? (
                    <Link
                      href={tier.cta.href}
                      className={`block w-full rounded-full px-5 py-3 text-center text-sm font-medium transition-colors ${
                        tier.featured
                          ? "bg-white text-black hover:bg-white/90"
                          : "border border-white/15 text-white/80 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {tier.cta.label}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="block w-full cursor-not-allowed rounded-full border border-white/10 px-5 py-3 text-center text-sm text-white/55"
                    >
                      {tier.cta.label}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div
            className="anim-rise mx-auto mt-10 max-w-3xl rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
            style={{ "--delay": "0.12s" } as CSSProperties}
          >
            <h2 className="text-sm font-medium text-white">Pembayaran lokal</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Tagihan dan checkout belum aktif — harga di halaman ini masih
              placeholder. Nanti pembayaran dilakukan lewat transfer bank atau
              virtual account Indonesia, bukan Stripe.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
