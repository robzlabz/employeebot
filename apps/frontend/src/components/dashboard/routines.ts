/**
 * Rutinitas view data — ported from the design's `ROUT` table plus the
 * `toMin`/`NOW_MIN` clock helpers that decide what has already run today.
 */

export type RoutineSlot = "hourly" | "daily" | "weekly";

export type Routine = {
  id: string;
  slot: RoutineSlot;
  /** `06.00` for daily/weekly, `Tiap jam` for hourly. */
  time: string;
  bot: string;
  title: string;
  freq: string;
  /** What the last run produced, shown after the completion time. */
  last?: string;
};

export const ROUT: Routine[] = [
  { id: "r1", slot: "daily", time: "06.00", bot: "Pinky", title: "Cek dokumen baru di folder Unduhan dan Drive, lalu rapikan namanya", freq: "Setiap hari", last: "4 file dirapikan" },
  { id: "r2", slot: "daily", time: "06.30", bot: "Kunyit", title: "Cek email masuk semalam dan tandai yang penting", freq: "Setiap hari", last: "3 email ditandai" },
  { id: "r3", slot: "daily", time: "07.00", bot: "Ijo", title: "Perbarui stok dan rekap pesanan kemarin", freq: "Setiap hari", last: "18 pesanan direkap" },
  { id: "r4", slot: "daily", time: "08.00", bot: "Lila", title: "Kirim ringkasan jadwal hari ini ke kamu", freq: "Senin–Jumat", last: "terkirim" },
  { id: "r5", slot: "daily", time: "09.00", bot: "Oren", title: "Buat invoice untuk pesanan yang sudah dikonfirmasi", freq: "Setiap hari", last: "3 draf invoice" },
  { id: "r7", slot: "daily", time: "13.00", bot: "Oren", title: "Kirim pengingat untuk invoice yang lewat jatuh tempo", freq: "Setiap hari" },
  { id: "r8", slot: "daily", time: "16.00", bot: "Ijo", title: "Cocokkan bukti transfer dengan tagihan", freq: "Setiap hari" },
  { id: "r9", slot: "daily", time: "17.00", bot: "Pinky", title: "Arsipkan semua dokumen yang masuk hari ini", freq: "Senin–Jumat" },
  { id: "r6", slot: "hourly", time: "Tiap jam", bot: "Biru", title: "Balas chat WhatsApp yang belum terjawab", freq: "08.00–21.00" },
  { id: "r11", slot: "hourly", time: "Tiap jam", bot: "Kunyit", title: "Cek email baru dan siapkan draf balasan", freq: "08.00–17.00" },
  { id: "r10", slot: "weekly", time: "Jumat", bot: "Ijo", title: "Kirim rekap mingguan ke email kamu, pukul 16.00", freq: "Setiap minggu" },
  { id: "r12", slot: "weekly", time: "Senin", bot: "Lila", title: "Susun jadwal rapat tim untuk seminggu, pukul 07.00", freq: "Setiap minggu" },
];

/** The mock "now", 10.30 — routines before it read as already done today. */
export const NOW_MIN = 10 * 60 + 30;

/** `"07.00"` → minutes since midnight. */
export function toMin(time: string): number {
  const [h, m] = String(time).split(".");
  return parseInt(h, 10) * 60 + parseInt(m || "0", 10);
}
