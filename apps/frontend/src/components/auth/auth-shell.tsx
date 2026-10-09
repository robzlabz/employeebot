"use client";

/**
 * Shared shell for the authentication pages: the card, the heading, the error
 * line, and the primary button. Every page in this flow is a client component,
 * because the access token lives in memory and the forms are interactive.
 */

import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-sm font-semibold text-bolu-muted">
        <span aria-hidden className="inline-block size-3 rounded-full bg-bolu-accent" />
        Keluarga Bolu
      </Link>

      <div className="rounded-3xl border border-bolu-border bg-bolu-surface p-7 shadow-[0_1px_2px_rgb(30_27_46_/_0.04)]">
        <h1 className="font-display text-2xl font-semibold text-bolu-ink">{title}</h1>
        <p className="mt-2 text-sm text-bolu-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>

      {footer ? <div className="mt-6 text-center text-sm text-bolu-muted">{footer}</div> : null}
    </main>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
};

export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  minLength,
  hint,
}: FieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-bolu-body">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full rounded-xl border border-bolu-border bg-bolu-surface px-3.5 py-2.5 text-[15px] text-bolu-ink outline-none transition focus:border-bolu-accent focus:ring-2 focus:ring-bolu-accent/20"
      />
      {hint ? <p className="mt-1.5 text-xs text-bolu-muted">{hint}</p> : null}
    </div>
  );
}

export function SubmitButton({
  label,
  pending,
  pendingLabel,
}: {
  label: string;
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-bolu-accent px-4 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#1a6cba] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-bolu-belum/30 bg-bolu-belum/8 text-bolu-belum",
    success: "border-bolu-lunas/30 bg-bolu-lunas/8 text-bolu-lunas",
    info: "border-bolu-border bg-bolu-panel/60 text-bolu-body",
  } as const;

  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mb-4 rounded-xl border px-3.5 py-2.5 text-sm ${styles[tone]}`}>
      {children}
    </p>
  );
}

export function GoogleButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-bolu-border bg-bolu-surface px-4 py-2.5 text-[15px] font-medium text-bolu-ink transition hover:bg-bolu-panel/60"
    >
      Masuk dengan Google
    </a>
  );
}
