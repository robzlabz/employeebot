"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AuthShell, SubmitButton } from "@/components/auth/auth-shell";
import { resendVerification, verifyEmail } from "@/lib/api";

/**
 * Email verification. With a token in the URL it consumes the token; without
 * one it offers to send a new link, which is what the login page points at when
 * an account has not been verified yet.
 */
export function VerifyEmailForm({ token, email }: { token: string | null; email: string | null }) {
  const router = useRouter();

  // The token case starts in "verifying": the request is already on its way, so
  // no state is set synchronously from the effect.
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "failed">(token ? "verifying" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [address, setAddress] = useState(email ?? "");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const result = await verifyEmail(token);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setStatus("failed");
        setMessage(result.message);
        return;
      }

      setStatus("verified");
      // A verified account with no workspace belongs in onboarding.
      setTimeout(() => router.push("/onboarding"), 900);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  async function onResend(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);

    const result = await resendVerification(address);
    setPending(false);

    setMessage(
      result.ok
        ? "Kalau alamat itu terdaftar dan belum diverifikasi, tautan baru sudah dikirim."
        : result.message,
    );
  }

  if (token) {
    return (
      <AuthShell title="Verifikasi email" subtitle="Sebentar, kami periksa tautannya.">
        {status === "verifying" ? <Alert tone="info">Memeriksa tautan…</Alert> : null}
        {status === "verified" ? <Alert tone="success">Email terverifikasi. Mengalihkan ke onboarding…</Alert> : null}
        {status === "failed" ? <Alert tone="error">{message ?? "Tautan tidak berlaku."}</Alert> : null}

        {status === "failed" ? (
          <>
            <p className="mb-4 text-sm text-bolu-muted">
              Tautan verifikasi hanya bisa dipakai sekali dan berlaku terbatas. Minta tautan baru di bawah.
            </p>
            <form onSubmit={onResend}>
              <input
                type="email"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="nama@usaha.com"
                required
                className="mb-3 w-full rounded-xl border border-bolu-border px-3.5 py-2.5 text-[15px] outline-none focus:border-bolu-accent focus:ring-2 focus:ring-bolu-accent/20"
              />
              <SubmitButton label="Kirim tautan baru" pending={pending} pendingLabel="Mengirim…" />
            </form>
          </>
        ) : null}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Cek emailmu"
      subtitle="Kami mengirim tautan verifikasi. Klik tautan itu untuk mengaktifkan akun."
      footer={
        <>
          Sudah verifikasi? <Link href="/masuk">Masuk</Link>
        </>
      }
    >
      {message ? <Alert tone="info">{message}</Alert> : null}

      <form onSubmit={onResend}>
        <input
          type="email"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="nama@usaha.com"
          required
          className="mb-3 w-full rounded-xl border border-bolu-border px-3.5 py-2.5 text-[15px] outline-none focus:border-bolu-accent focus:ring-2 focus:ring-bolu-accent/20"
        />
        <SubmitButton label="Kirim ulang tautan" pending={pending} pendingLabel="Mengirim…" />
      </form>
    </AuthShell>
  );
}
