import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Employee Bot — Bot yang mengerjakan pekerjaan manusia",
    template: "%s · Employee Bot",
  },
  description:
    "Employee Bot memberi setiap bot komputer virtual, terminal, browser, dan memori jangka panjang dengan sesi persisten. Satu perusahaan, banyak bot, satu workspace bersama.",
  openGraph: {
    title: "Employee Bot",
    description:
      "Bot yang mengerjakan pekerjaan manusia. Komputer virtual, memori persisten, dan tim bot untuk satu perusahaan.",
    siteName: "Employee Bot",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-black">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
