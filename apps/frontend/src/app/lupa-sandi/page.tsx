import type { Metadata } from "next";
import { Suspense } from "react";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export const metadata: Metadata = {
  title: "Lupa kata sandi",
  description: "Atur ulang kata sandi akun Bolu-mu.",
};

// With ?token= the page asks for the new password; without it, for the address.
export default function LupaSandiPage({ searchParams }: PageProps<"/lupa-sandi">) {
  return (
    <Suspense fallback={null}>
      <LupaSandiContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LupaSandiContent({ searchParams }: { searchParams: PageProps<"/lupa-sandi">["searchParams"] }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  return <PasswordResetForm token={token} />;
}
