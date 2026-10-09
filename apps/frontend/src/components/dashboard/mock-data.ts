/**
 * Dashboard mock data — ported 1:1 from design/dashboard-logic.js.
 * Body shapes, colours and face defaults come from `@/lib/crew`; everything
 * else here is dashboard-only copy (keywords, drafts, threads, live feed).
 */
import { allBot, bot, type CrewMember } from "@/lib/crew";

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
  Cerah: [
    ["bot", "Hai! Kalender konten minggu ini sudah kuisi 5 postingan. Drafnya bisa kamu cek kapan saja."],
  ],
  Gembul: [
    ["bot", "Iklan promo kaos sedang berjalan. Ringkasan hasilnya kukirim tiap sore."],
  ],
  Riang: [
    [
      "bot",
      "Ada 12 komentar baru di Instagram, 11 sudah kubalas. Satu keluhan kutahan untuk kamu baca.",
    ],
  ],
};

/** A group thread seed: `[who, text, draftId?]`, where `who` is a bot name or `you`. */
export type GroupSeedMsg = [string, string, DraftId?];

export type Group = {
  id: string;
  name: string;
  /** Which sidebar section the group belongs to. */
  team: "bolu" | "hore";
  members: string[];
  desc: string;
  chips: string[];
  seed: GroupSeedMsg[];
};

export const GROUPS: Record<string, Group> = {
  g1: {
    id: "g1",
    name: "Grup Tagihan",
    team: "bolu",
    members: ["Oren", "Ijo", "Lila"],
    desc: "Dari pesanan masuk sampai lunas: Ijo mencatat, Oren menagih, Lila mengingatkan.",
    chips: ["Siapa saja yang belum bayar?", "Kirim ringkasan tagihan minggu ini", "Percepat pengingat jadi H-3"],
    seed: [
      ["Ijo", "Rekap hari ini: 3 pesanan baru, 2 belum lunas."],
      ["Oren", "Invoice untuk 3 pesanan sudah kubuat. Yang belum lunas kuantrekan pengingatnya."],
      ["Lila", "Pengingat jatuh tempo sudah kupasang H-1 untuk semua invoice."],
      ["you", "Mantap, makasih tim!"],
      ["Oren", "Sama-sama! Tinggal INV-0043 yang perlu kamu setujui.", "a1"],
    ],
  },
  g2: {
    id: "g2",
    name: "Grup Pelanggan",
    team: "bolu",
    members: ["Biru", "Ijo", "Kunyit", "Pinky"],
    desc: "Semua urusan pelanggan, dari chat WhatsApp, email, sampai dokumen yang mereka minta.",
    chips: ["Ada pelanggan yang komplain hari ini?", "Kirim ulang invoice bulan lalu ke Rina", "Rangkum pertanyaan terbanyak minggu ini"],
    seed: [
      ["Biru", "Ada pelanggan minta salinan invoice bulan lalu lewat WhatsApp."],
      ["Pinky", "Ketemu! INV-0031 ada di Arsip/2026/September. Sudah kuoper ke Biru."],
      ["Biru", "Terkirim ke pelanggan. Terima kasih, Pinky!"],
      ["Kunyit", "Pelanggan yang sama juga kirim email, sudah kubalas dengan lampiran yang sama."],
    ],
  },
  g3: {
    id: "g3",
    name: "Kampanye Oktober",
    team: "hore",
    members: ["Cerah", "Gembul"],
    desc: "Cerah menyiapkan konten, Gembul mengubahnya jadi iklan dan memantau hasilnya.",
    chips: ["Caption mana yang paling bagus?", "Naikkan iklan yang paling laku", "Buat versi iklan untuk Story"],
    seed: [
      ["Cerah", "Draf 5 caption untuk promo kaos Oktober sudah siap."],
      ["Gembul", "Aku pakai caption nomor 2 untuk iklan. Anggaran harian: [ANGGARAN]."],
      ["Cerah", "Siap, nanti kubuatkan versi Story-nya juga."],
    ],
  },
};

export const GORDER_BOLU = ["g1", "g2"];
export const GORDER_HORE = ["g3"];

/** Is `id` a group conversation? */
export function isGroupId(id: string): boolean {
  return id in GROUPS;
}

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

const HORE_DASH_SEEDS: DashSeed[] = [
  {
    name: "Cerah",
    kw: ["konten", "caption", "posting", "instagram", "ig", "feed"],
    done: 5,
    bio: "Aku menulis caption, menyusun kalender konten, dan menyiapkan jadwal posting media sosial.",
    skills: ["Menulis caption sesuai gaya brand", "Menyusun kalender konten mingguan", "Menjadwalkan posting"],
    chips: ["Buat 5 caption promo minggu ini", "Susun kalender konten November", "Ide konten untuk hari Jumat"],
    after: "Draf kontennya kutaruh di sini untuk kamu cek dulu.",
    team: "Menyerahkan caption terbaik ke Gembul untuk dijadikan iklan.",
    mates: ["Gembul", "Riang"],
    acts: ["menulis caption promo", "menyusun kalender konten", "menjadwalkan posting"],
  },
  {
    name: "Gembul",
    kw: ["iklan", "ads", "anggaran", "budget", "kampanye"],
    done: 3,
    bio: "Aku memantau iklan yang berjalan, mencatat hasilnya, dan memberi saran kapan perlu diubah.",
    skills: ["Memantau hasil iklan harian", "Membandingkan versi iklan", "Melapor ringkasan tiap sore"],
    chips: ["Ringkas hasil iklan kemarin", "Bandingkan dua versi iklan", "Hentikan iklan yang boros"],
    after: "Anggaran iklan tidak akan kuubah tanpa persetujuanmu.",
    team: "Memakai caption dari Cerah dan meminta Riang memantau komentar di iklan.",
    mates: ["Cerah", "Riang"],
    acts: ["memantau iklan promo", "mencatat hasil iklan", "membandingkan dua versi iklan"],
  },
  {
    name: "Riang",
    kw: ["komentar", "dm", "review", "ulasan", "mention"],
    done: 12,
    bio: "Aku membalas komentar dan DM media sosial, dan menahan keluhan supaya kamu bisa membacanya dulu.",
    skills: ["Membalas komentar dan DM", "Menandai keluhan pelanggan", "Mengucapkan terima kasih untuk ulasan bagus"],
    chips: ["Balas komentar yang belum terjawab", "Rangkum keluhan minggu ini", "Balas ulasan bintang 5"],
    after: "Komentar bernada keluhan kutahan dulu untuk kamu baca.",
    team: "Melapor ke Gembul kalau ada komentar ramai di iklan.",
    mates: ["Gembul", "Cerah"],
    acts: ["membalas komentar Instagram", "menandai keluhan", "membalas DM"],
  },
];

/** Dashboard crew, in sidebar order — shapes come from the landing crew. */
export const DASH_BOTS: DashBot[] = DASH_SEEDS.map((seed) => ({ ...bot(seed.name), ...seed }));

/** The Tim Hore crew, shown under "Tim lain" in the sidebar. */
export const HORE_BOTS: DashBot[] = HORE_DASH_SEEDS.map((seed) => ({
  ...allBot(seed.name),
  ...seed,
}));

/** Every dashboard bot, both teams. */
export const ALL_DASH_BOTS: DashBot[] = [...DASH_BOTS, ...HORE_BOTS];

/** Dashboard crew lookup that throws on typos instead of rendering nothing. */
export function dashBot(name: string): DashBot {
  const found = ALL_DASH_BOTS.find((member) => member.name === name);
  if (!found) throw new Error(`Unknown dashboard crew member: ${name}`);
  return found;
}
