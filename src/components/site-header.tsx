import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
];

function BotMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="13" r="8.5" strokeOpacity="0.35" />
      <circle cx="9.2" cy="12" r="1.6" fill="#7dd3fc" stroke="none" />
      <circle cx="14.8" cy="12" r="1.6" fill="#7dd3fc" stroke="none" />
      <path d="M9.6 16.2q2.4 2 4.8 0" strokeLinecap="round" strokeOpacity="0.75" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-full py-1 pr-1 text-white transition-opacity hover:opacity-80"
        >
          <BotMark />
          <span className="text-sm font-medium tracking-tight">Employee Bot</span>
        </Link>

        <ul className="flex items-center gap-0.5 sm:gap-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-2.5 py-1.5 text-[13px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white sm:px-3 sm:text-sm"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[13px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white sm:px-3 sm:text-sm"
            >
              Dashboard
              <span className="hidden rounded-full border border-white/10 px-1.5 py-px text-[10px] uppercase tracking-wide text-white/60 sm:inline">
                Soon
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
