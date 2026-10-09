import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verifikasi email",
  description: "Verifikasi alamat email akun Bolu-mu.",
};

// The token arrives in the query string. Reading searchParams must happen inside
// a Suspense boundary, otherwise the route cannot be prerendered.
export default function VerifikasiPage({ searchParams }: PageProps<"/verifikasi">) {
  return (
    <Suspense fallback={null}>
      <VerifikasiContent searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifikasiContent({ searchParams }: { searchParams: PageProps<"/verifikasi">["searchParams"] }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  const email = typeof params.email === "string" ? params.email : null;

  return <VerifyEmailForm token={token} email={email} />;
}
