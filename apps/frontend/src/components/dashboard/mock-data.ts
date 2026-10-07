/**
 * Dashboard mock data — ported 1:1 from design/dashboard-logic.js.
 * Body shapes, colours and face defaults come from `@/lib/crew`; everything
 * else here is dashboard-only copy (keywords, drafts, threads, live feed).
 */
import { bot, type CrewMember } from "@/lib/crew";

export type DraftId = "a1" | "a2" | "a3" | "a4" | "a5";

export type Draft = {
  bot: string;
  kind: string;
  title: string;
  meta: string;
  cta: string;
  fields: [string, string][];
  draft: string;
};

export const DRAFTS: Record<DraftId, Draft> = {
  a1: {
    bot: "Oren",
    kind: "Invoice",
    title: "INV-0043 untuk Toko Sari",
    meta: "Rp 1.124.000 · jatuh tempo 21 Okt",
    cta: "Setujui & kirim",
    fields: [
      ["Pelanggan", "Toko Sari"],
      ["Isi", "Kaos polos ×10, sablon, ongkir"],
      ["Total", "Rp 1.124.000"],
    ],
    draft:
      "Halo Bu Sari, terlampir invoice INV-0043 untuk pesanan kaos 10 pcs.\nMohon dibayar sebelum 21 Oktober. Terima kasih!",
  },
  a5: {
    bot: "Oren",
    kind: "Penagihan",
    title: "Pengingat bayar untuk Bagas",
    meta: "Telat 3 hari · Rp 189.000",
    cta: "Setujui & kirim",
    fields: [
      ["Invoice", "INV-0039"],
      ["Jatuh tempo", "4 Oktober"],
      ["Pengingat ke-", "1"],
    ],
    draft:
      "Halo Kak Bagas, sekadar mengingatkan invoice INV-0039 sebesar Rp 189.000 sudah lewat jatuh tempo. Kalau sudah transfer, abaikan pesan ini ya.",
  },
  a2: {
    bot: "Biru",
    kind: "Balasan WhatsApp",
    title: "Balasan untuk Dimas",
    meta: "Tanya status pesanan hoodie",
    cta: "Setujui & kirim",
    fields: [
      ["Pesan masuk", "“Kak, hoodie saya kapan dikirim?”"],
      ["Data dari", "Rekap Ijo · belum lunas"],
    ],
    draft:
      "Halo Kak Dimas! Hoodie abu ukuran M sudah siap. Pesanan dikirim setelah pembayaran Rp 245.000 kami terima ya, Kak.",
  },
  a4: {
    bot: "Lila",
    kind: "Undangan rapat",
    title: "Rapat evaluasi Kamis 10.00",
    meta: "4 peserta · 45 menit",
    cta: "Setujui & undang",
    fields: [
      ["Waktu", "Kamis, 8 Okt · 10.00–10.45"],
      ["Peserta", "4 orang, semua kosong"],
      ["Tempat", "Daring"],
    ],
    draft: "Agenda: evaluasi penjualan minggu ini dan rencana stok November.",
  },
  a3: {
    bot: "Kunyit",
    kind: "Email",
    title: "Balasan ke CV Maju",
    meta: "Permintaan penawaran harga",
    cta: "Setujui & kirim",
    fields: [
      ["Dari", "pengadaan@[DOMAIN]"],
      ["Lampiran", "Daftar harga Oktober.pdf"],
    ],
    draft:
      "Selamat siang, terima kasih atas minatnya. Kami lampirkan daftar harga terbaru.\nUntuk pesanan di atas 50 pcs, harga khusus bisa kita diskusikan.",
  },
};

/** The order the dashboard lists pending drafts in. */
export const ORDER: DraftId[] = ["a1", "a2", "a3", "a4", "a5"];

export type MsgFrom = "you" | "bot";
export type SeedMsg = [MsgFrom, string, DraftId?];

export const SEED: Record<string, SeedMsg[]> = {
  Oren: [
    ["bot", "Selamat pagi! Ada 3 pesanan baru dari rekap Ijo, invoice-nya sudah kusiapkan."],
    ["bot", "INV-0043 untuk Toko Sari siap dikirim:", "a1"],
    ["bot", "Bagas sudah telat bayar 3 hari. Boleh kukirim pengingat pertama?", "a5"],
  ],
  Biru: [
    ["you", "Biru, kalau ada yang tanya ongkir pakai tarif terbaru ya"],
    ["bot", "Siap, tarif terbaru sudah kucatat. Pagi ini 6 chat sudah kubalas."],
    ["bot", "Dimas tanya soal hoodie-nya. Ini draf balasanku:", "a2"],
  ],
  Lila: [["bot", "Semua peserta kosong di Kamis jam 10. Mau kukirim undangannya?", "a4"]],
  Ijo: [
    [
      "bot",
      "Rekap minggu ini sudah kuperbarui: 18 pesanan, 2 belum lunas. Datanya sudah kuoper ke Oren untuk penagihan.",
    ],
  ],
  Pinky: [
    ["bot", "Folder Unduhan sudah rapi! 14 file kuganti namanya dan kupindahkan ke Arsip/2026/Oktober."],
  ],
  Kunyit: [
    ["bot", "Ada 30 email masuk sejak kemarin, 3 kutandai penting."],
    ["bot", "Ini draf balasan untuk CV Maju:", "a3"],
  ],
};

/** [who, what, when] for the live activity feed's opening rows. */
export const INIT_FEED: [string, string, string][] = [
  ["Ijo", "memperbarui rekap pesanan", "10.28"],
  ["Pinky", "merapikan 14 file di Unduhan", "10.24"],
  ["Biru", "membalas 6 chat pelanggan", "10.19"],
  ["Oren", "mengirim INV-0042 ke Rina", "10.12"],
  ["Kunyit", "menandai 3 email penting", "10.05"],
];

type DashSeed = {
  name: string;
  /** Keywords that route a "Suruh Bolu" task to this bot. */
  kw: string[];
  /** Tasks finished today, before the live counter is added. */
  done: number;
  bio: string;
  skills: string[];
  /** Starter prompts shown under the bot's bio. */
  chips: string[];
  /** Where the bot leaves its work, appended to every chat reply. */
  after: string;
  team: string;
  /** Crew members this bot hands work to. */
  mates: string[];
  /** Lowercase "currently working on" lines, used by the feed and status. */
  acts: string[];
};

export type DashBot = Omit<CrewMember, "bio" | "acts"> & DashSeed;

const DASH_SEEDS: DashSeed[] = [
  {
    name: "Oren",
    kw: ["invoice", "tagih", "bayar", "faktur"],
    done: 14,
    bio: "Aku bikin invoice dari data pesanan, mengirimnya ke pelanggan, dan menagih dengan sopan kalau sudah lewat jatuh tempo.",
    skills: [
      "Membuat invoice dari rekap pesanan",
      "Menghitung diskon, pajak, dan ongkir",
      "Mengirim pengingat bayar bertahap",
    ],
    chips: ["Buat invoice untuk pesanan hari ini", "Tagih invoice yang telat", "Kirim ringkasan tagihan"],
    after: "Drafnya kutaruh di sini dan di Dasbor begitu siap.",
    team: "Mengambil data pesanan dari Ijo, lalu minta Lila memasang pengingat jatuh tempo.",
    mates: ["Ijo", "Lila"],
    acts: ["membuat invoice INV-0044", "menghitung pajak pesanan", "menyiapkan pengingat bayar"],
  },
  {
    name: "Biru",
    kw: ["wa", "whatsapp", "chat", "balas", "pelanggan", "resi"],
    done: 23,
    bio: "Aku menjawab chat pelanggan yang itu-itu saja: ongkir, status pesanan, stok, jam buka, dan nomor rekening.",
    skills: [
      "Membalas pertanyaan umum dengan gaya bahasamu",
      "Mengirim nomor resi dan status pesanan",
      "Menahan chat sensitif untuk kamu baca dulu",
    ],
    chips: ["Balas semua chat soal ongkir", "Kirim resi ke pelanggan hari ini", "Pakai gaya bahasa lebih santai"],
    after: "Balasan yang sensitif tetap kutahan dulu untuk kamu cek.",
    team: "Mengecek status pesanan ke Ijo dan meneruskan permintaan invoice ke Oren.",
    mates: ["Ijo", "Oren"],
    acts: ["membalas chat soal ongkir", "mengirim nomor resi", "membalas pertanyaan stok"],
  },
  {
    name: "Lila",
    kw: ["jadwal", "rapat", "meeting", "ingat", "kalender"],
    done: 6,
    bio: "Aku mencarikan waktu rapat yang pas untuk semua orang, mengirim undangan, dan mengingatkan tenggat.",
    skills: ["Mencari slot kosong semua peserta", "Mengirim undangan kalender", "Mengingatkan tenggat sehari sebelumnya"],
    chips: ["Jadwalkan rapat tim minggu depan", "Ingatkan tenggat pajak", "Kosongkan Jumat sore"],
    after: "Kalau ada jadwal yang bentrok, aku kabari dulu sebelum mengirim undangan.",
    team: "Memasang pengingat jatuh tempo untuk invoice buatan Oren.",
    mates: ["Oren", "Kunyit"],
    acts: ["mencari slot rapat", "mengirim undangan kalender", "memasang pengingat tenggat"],
  },
  {
    name: "Ijo",
    kw: ["rekap", "data", "stok", "laporan", "spreadsheet", "excel"],
    done: 11,
    bio: "Aku memindahkan data pesanan ke spreadsheet, memperbarui stok, dan menyusun rekap mingguan.",
    skills: ["Mencatat pesanan dari chat dan email", "Memperbarui sisa stok", "Menyusun rekap mingguan"],
    chips: ["Rekap penjualan minggu ini", "Cek stok yang hampir habis", "Ekspor data ke Excel"],
    after: "Hasilnya kusimpan di sheet Rekap Oktober.",
    team: "Menerima pesanan dari Biru dan mengoper datanya ke Oren untuk dibuatkan invoice.",
    mates: ["Biru", "Oren"],
    acts: ["mencatat pesanan baru", "memperbarui sisa stok", "menyusun rekap mingguan"],
  },
  {
    name: "Pinky",
    kw: ["file", "arsip", "folder", "dokumen", "scan", "kontrak"],
    done: 14,
    bio: "Aku merapikan nama file, memilah dokumen, dan menyimpan bukti transfer ke folder yang benar.",
    skills: ["Memberi nama file yang jelas", "Memindahkan dokumen ke folder yang tepat", "Mencari dokumen lama dengan cepat"],
    chips: ["Rapikan folder Unduhan", "Arsipkan bukti transfer bulan ini", "Cari kontrak Toko Sari"],
    after: "Nama file lamanya tetap kucatat, jadi gampang dicari lagi.",
    team: "Menyimpan invoice Oren dan menautkan bukti bayar ke rekap Ijo.",
    mates: ["Oren", "Ijo"],
    acts: ["mengganti nama scan_0201.pdf", "memindahkan kuitansi", "menyimpan bukti transfer"],
  },
  {
    name: "Kunyit",
    kw: ["email", "surel", "inbox", "surat"],
    done: 9,
    bio: "Aku memilah inbox, menandai email penting, dan menyiapkan draf balasan untuk kamu periksa.",
    skills: ["Memilah email masuk", "Menandai yang butuh keputusanmu", "Menyiapkan draf balasan"],
    chips: ["Pilah email yang belum dibaca", "Ringkas email minggu ini", "Siapkan balasan untuk CV Maju"],
    after: "Email yang butuh keputusanmu kutandai merah.",
    team: "Mengirim invoice Oren lewat email dan meneruskan undangan rapat dari Lila.",
    mates: ["Oren", "Lila"],
    acts: ["memilah email masuk", "menandai email penting", "menyiapkan draf balasan"],
  },
];

/** Dashboard crew, in sidebar order — shapes come from the landing crew. */
export const DASH_BOTS: DashBot[] = DASH_SEEDS.map((seed) => ({ ...bot(seed.name), ...seed }));

/** Dashboard crew lookup that throws on typos instead of rendering nothing. */
export function dashBot(name: string): DashBot {
  const found = DASH_BOTS.find((member) => member.name === name);
  if (!found) throw new Error(`Unknown dashboard crew member: ${name}`);
  return found;
}
