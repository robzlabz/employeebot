/** Pengaturan view data — workspace defaults and the three reply tones. */

export type ToggleKey = "wa" | "ingat" | "invoice" | "email" | "rapat";
export type NotifKey = "pagi" | "draf" | "sore" | "error";

export type Settings = {
  ws: string;
  tz: string;
  lang: string;
  start: string;
  end: string;
  days: Record<string, boolean>;
  tone: string;
  auto: Record<ToggleKey, boolean>;
  notif: Record<NotifKey, boolean>;
};

export const TZONES = ["WIB (GMT+7)", "WITA (GMT+8)", "WIT (GMT+9)"];
export const LANGS: [string, string][] = [
  ["id", "Bahasa Indonesia"],
  ["en", "English"],
  ["cust", "Ikuti bahasa pelanggan"],
];

export const TONES: Record<string, string> = {
  Santai: "Halo Kak! Pesananmu udah dikirim hari ini ya, resinya [NO RESI]. Makasih udah belanja!",
  Ramah: "Halo Kak, pesananmu sudah dikirim hari ini dengan nomor resi [NO RESI]. Terima kasih sudah berbelanja!",
  Formal:
    "Selamat siang, Bapak/Ibu. Pesanan Anda telah dikirim hari ini dengan nomor resi [NO RESI]. Terima kasih atas kepercayaan Anda.",
};

export const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function initialSettings(): Settings {
  return {
    ws: "[NAMA USAHA]",
    tz: "WIB (GMT+7)",
    lang: "id",
    start: "08:00",
    end: "21:00",
    days: { Sen: true, Sel: true, Rab: true, Kam: true, Jum: true, Sab: true, Min: false },
    tone: "Ramah",
    auto: { wa: true, invoice: false, email: false, rapat: false, ingat: true },
    notif: { pagi: true, draf: true, sore: true, error: true },
  };
}

/** The Persetujuan toggles, in the order the design lists them. */
export const AUTO_ROWS: { key: ToggleKey; title: string; desc: string; bot: string }[] = [
  { key: "wa", title: "Balasan WhatsApp umum", desc: "Ongkir, jam buka, stok, nomor rekening", bot: "Biru" },
  { key: "ingat", title: "Pengingat jatuh tempo", desc: "Pengingat pertama sebelum tanggal jatuh tempo", bot: "Lila" },
  { key: "invoice", title: "Invoice ke pelanggan", desc: "Invoice baru dan penagihan", bot: "Oren" },
  { key: "email", title: "Balasan email", desc: "Email ke pelanggan dan rekanan", bot: "Kunyit" },
  { key: "rapat", title: "Undangan rapat", desc: "Undangan kalender ke orang lain", bot: "Lila" },
];

export const NOTIF_ROWS: { key: NotifKey; title: string; desc: string }[] = [
  { key: "pagi", title: "Ringkasan pagi", desc: "Jadwal dan pekerjaan hari ini, dikirim jam 08.00" },
  { key: "draf", title: "Draf baru menunggu", desc: "Setiap ada draf yang perlu kamu setujui" },
  { key: "sore", title: "Laporan sore", desc: "Apa saja yang sudah dikerjakan tim hari ini" },
  { key: "error", title: "Kalau ada kendala", desc: "Misalnya aplikasi terputus atau data tidak cocok" },
];
