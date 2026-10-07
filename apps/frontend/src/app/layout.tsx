import type { Metadata, Viewport } from "next";
import { Figtree, Fredoka } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Keluarga Bolu — asisten kerja kantor",
    template: "%s · Keluarga Bolu",
  },
  description:
    "Enam asisten kecil yang kerja bareng untukmu: bikin invoice, balas WhatsApp, rekap pesanan, sampai merapikan file. Mereka siapkan semuanya, kamu tinggal cek dan setujui.",
  openGraph: {
    title: "Keluarga Bolu — asisten kerja kantor",
    description:
      "Enam asisten kecil yang kerja bareng untukmu: bikin invoice, balas WhatsApp, rekap pesanan, sampai merapikan file.",
    siteName: "Keluarga Bolu",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F6FB",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${figtree.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bolu-bg font-sans text-bolu-ink">
        {children}
      </body>
    </html>
  );
}
