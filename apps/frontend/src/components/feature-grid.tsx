const FEATURES = [
  {
    title: "Virtual computer",
    body: "Setiap bot dapat komputer, terminal, dan browser sendiri — persisten dan siap kerja 24/7.",
    icon: (
      <>
        <rect x="2.5" y="4" width="19" height="13" rx="2" />
        <path d="M8.5 20.5h7M12 17v3.5" />
      </>
    ),
  },
  {
    title: "Tim bot",
    body: "Satu perusahaan bisa punya banyak bot. Mereka berkolaborasi di grup dan berbagi satu workspace.",
    icon: (
      <>
        <circle cx="9" cy="8.5" r="3.2" />
        <circle cx="17" cy="9.5" r="2.3" />
        <path d="M3.5 19.5c.6-3.1 2.9-4.7 5.5-4.7s4.9 1.6 5.5 4.7" />
        <path d="M15.6 14.9c2.3.2 4.1 1.6 4.7 4.6" />
      </>
    ),
  },
  {
    title: "Memori & auto-learn",
    body: "Catatan personal dan global. Bot mengingat konteks kerja dan belajar dari kebiasaan kamu.",
    icon: (
      <>
        <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
        <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
      </>
    ),
  },
  {
    title: "Billing Indonesia",
    body: "Bayar lewat transfer bank atau virtual account. Tanpa Stripe, tanpa kartu kredit.",
    icon: (
      <>
        <path d="M3 9.5 12 4l9 5.5" />
        <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
        <path d="M3 20.5h18" />
      </>
    ),
  },
];

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-heading">
      <h2 id="features-heading" className="sr-only">
        Fitur inti Employee Bot
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <li
            key={feature.title}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors hover:border-white/15 hover:bg-white/[0.04]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5"
              >
                {feature.icon}
              </svg>
            </span>
            <h3 className="mt-5 text-sm font-medium text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">{feature.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
