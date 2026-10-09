import type { Metadata } from "next";
import { Suspense } from "react";
import { InviteAccept } from "@/components/auth/onboarding-form";

export const metadata: Metadata = {
  title: "Undangan",
  description: "Terima undangan bergabung ke workspace Bolu.",
};

export default function GabungPage({ searchParams }: PageProps<"/gabung">) {
  return (
    <Suspense fallback={null}>
      <GabungContent searchParams={searchParams} />
    </Suspense>
  );
}

async function GabungContent({ searchParams }: { searchParams: PageProps<"/gabung">["searchParams"] }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  return <InviteAccept token={token} />;
}
