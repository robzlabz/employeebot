import type { Metadata } from "next";
import { CredentialsForm } from "@/components/auth/credentials-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke workspace Bolu-mu.",
};

export default function MasukPage() {
  return <CredentialsForm mode="masuk" />;
}
