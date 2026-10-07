import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Dasbor",
  description:
    "Dasbor Keluarga Bolu: pantau pekerjaan anggota tim, setujui draf, dan suruh Bolu mengerjakan tugas berikutnya.",
  robots: { index: false },
};

export default function DashboardPage() {
  return <DashboardShell />;
}
