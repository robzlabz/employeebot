/**
 * Integrasi view data — ported from the design's `APPS`, `ICATS` and
 * `INIT_INTEG` tables. Everything here is mock copy, no real accounts.
 */

export type AppItem = {
  id: string;
  name: string;
  cat: string;
  /** Brand tile background. */
  tile: string;
  /** Monogram shown on the tile. */
  mono: string;
  desc: string;
  /** Crew members that can use the app by default. */
  bots: string[];
  /** Google apps prefill the account field with the workspace address. */
  google?: boolean;
};

export const APPS: AppItem[] = [
  { id: "gmail", name: "Gmail", cat: "Email & kalender", tile: "#C5362B", mono: "Gm", desc: "Membaca, memilah, dan membalas email.", bots: ["Kunyit", "Oren"], google: true },
  { id: "gcal", name: "Google Calendar", cat: "Email & kalender", tile: "#2F6FD6", mono: "Ca", desc: "Melihat jadwal kosong dan mengirim undangan rapat.", bots: ["Lila"], google: true },
  { id: "outlook", name: "Outlook", cat: "Email & kalender", tile: "#0F5FA8", mono: "Ou", desc: "Email dan kalender Microsoft.", bots: ["Kunyit", "Lila"] },
  { id: "drive", name: "Google Drive", cat: "Dokumen & file", tile: "#1A7F45", mono: "Dr", desc: "Menyimpan, mencari, dan merapikan dokumen.", bots: ["Pinky"], google: true },
  { id: "sheets", name: "Google Sheets", cat: "Dokumen & file", tile: "#127A43", mono: "Sh", desc: "Menulis rekap dan membaca data pesanan.", bots: ["Ijo"], google: true },
  { id: "dropbox", name: "Dropbox", cat: "Dokumen & file", tile: "#0050D1", mono: "Db", desc: "Mengarsipkan file ke Dropbox.", bots: ["Pinky"] },
  { id: "notion", name: "Notion", cat: "Dokumen & file", tile: "#2B2840", mono: "No", desc: "Catatan, SOP, dan basis data tim.", bots: ["Ijo", "Lila"] },
  { id: "wa", name: "WhatsApp Business", cat: "Chat", tile: "#1E7D4A", mono: "WA", desc: "Membalas chat pelanggan dan mengirim resi.", bots: ["Biru"] },
  { id: "slack", name: "Slack", cat: "Chat", tile: "#611F69", mono: "Sl", desc: "Mengirim laporan dan menerima perintah lewat Slack.", bots: ["Lila", "Kunyit"] },
  { id: "jira", name: "Jira", cat: "Proyek & developer", tile: "#0C55C4", mono: "Ji", desc: "Membuat dan memperbarui tiket, memantau sprint.", bots: ["Lila"] },
  { id: "github", name: "GitHub", cat: "Proyek & developer", tile: "#24292F", mono: "GH", desc: "Memantau issue dan pull request, merangkum perubahan.", bots: ["Kunyit"] },
  { id: "trello", name: "Trello", cat: "Proyek & developer", tile: "#0067A3", mono: "Tr", desc: "Memindahkan kartu dan membuat checklist.", bots: ["Lila"] },
  { id: "tokopedia", name: "Tokopedia", cat: "Toko online", tile: "#2E8B3E", mono: "To", desc: "Menarik pesanan dan membalas chat pembeli.", bots: ["Ijo", "Biru"] },
  { id: "shopee", name: "Shopee", cat: "Toko online", tile: "#C9401F", mono: "Sp", desc: "Menarik pesanan dan memperbarui stok.", bots: ["Ijo"] },
  { id: "instagram", name: "Instagram", cat: "Media sosial", tile: "#A72D72", mono: "IG", desc: "Menjadwalkan posting dan membalas komentar.", bots: ["Cerah", "Riang"] },
  { id: "midtrans", name: "Midtrans", cat: "Keuangan", tile: "#002855", mono: "Mi", desc: "Membuat link pembayaran dan mengecek status bayar.", bots: ["Oren"] },
];

export const APP: Record<string, AppItem> = Object.fromEntries(APPS.map((a) => [a.id, a]));

export const ICATS = [
  "Semua",
  "Email & kalender",
  "Dokumen & file",
  "Chat",
  "Proyek & developer",
  "Toko online",
  "Media sosial",
  "Keuangan",
];

export type Permission = "r" | "rw";

export type Integ = {
  account: string;
  bots: string[];
  perm: Permission;
  /** Last sync time, in the design's `10.28` clock format. */
  at: string;
  /** Just connected — plays the pop animation once. */
  fresh?: boolean;
};

export const INIT_INTEG: Record<string, Integ> = {
  gmail: { account: "bisnis@[DOMAIN]", bots: ["Kunyit", "Oren"], perm: "rw", at: "10.12" },
  drive: { account: "bisnis@[DOMAIN]", bots: ["Pinky"], perm: "rw", at: "10.24" },
  sheets: { account: "bisnis@[DOMAIN]", bots: ["Ijo"], perm: "rw", at: "10.28" },
  wa: { account: "+62 [NOMOR WA]", bots: ["Biru"], perm: "rw", at: "10.19" },
  instagram: { account: "@[AKUN IG]", bots: ["Cerah", "Riang"], perm: "rw", at: "09.40" },
};
