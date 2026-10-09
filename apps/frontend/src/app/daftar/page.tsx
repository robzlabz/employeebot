import type { Metadata } from "next";
import { CredentialsForm } from "@/components/auth/credentials-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun Bolu dan dapatkan tim asisten untuk usahamu.",
};

export default function DaftarPage() {
  return <CredentialsForm mode="daftar" />;
}
