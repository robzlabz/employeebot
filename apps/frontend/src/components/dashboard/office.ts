/**
 * Kantor (office) view data — ported from the design's `FURN`, `ST`, `ROUTE`,
 * `HOME`, `PLACE`, `SOFA`, `QUEUE` and `BEAN` tables. Positions are all in
 * percent of the room box, so the room scales with the viewport.
 */
import type { CSSProperties } from "react";

export type Furniture = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  /** Draw the monitor sitting on top of the desk. */
  desk?: boolean;
  /** Draw the stacked-paper shelves. */
  shelf?: boolean;
  bg: string;
  extra?: CSSProperties;
};

export const FURN: Furniture[] = [
  { x: 10, y: 16, w: 16, h: 12, label: "Meja invoice", desk: true, bg: "#C99A6B" },
  { x: 34, y: 16, w: 16, h: 12, label: "Meja WhatsApp", desk: true, bg: "#C99A6B" },
  { x: 58, y: 16, w: 16, h: 12, label: "Meja email", desk: true, bg: "#C99A6B" },
  {
    x: 80,
    y: 11,
    w: 16,
    h: 15,
    label: "Papan jadwal",
    bg: "#FFFFFF",
    extra: {
      border: "4px solid #A77DC9",
      backgroundImage:
        "linear-gradient(90deg, #FFE08A 0 30%, transparent 30% 36%, #F59ABF 36% 62%, transparent 62% 68%, #9AD8FF 68%)",
      backgroundSize: "100% 30%",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "0 30%",
    },
  },
  { x: 5, y: 58, w: 14, h: 22, label: "Rak rekap", shelf: true, bg: "#B7895E" },
  {
    x: 25,
    y: 64,
    w: 14,
    h: 18,
    label: "Lemari arsip",
    bg: "#9AA3B8",
    extra: { backgroundImage: "repeating-linear-gradient(180deg, #9AA3B8 0 30%, #7D869C 30% 33%)" },
  },
  { x: 45, y: 46, w: 10, h: 9, label: "Printer", bg: "#E3E5EF", extra: { border: "3px solid #5E5B70" } },
  { x: 52, y: 68, w: 20, h: 11, label: "Meja persetujuanmu", bg: "#FFFFFF", extra: { border: "4px dashed #E2602B" } },
  { x: 77, y: 76, w: 21, h: 10, label: "Sofa santai", bg: "#A77DC9", extra: { borderRadius: "24px 24px 12px 12px" } },
  { x: 80, y: 46, w: 7, h: 9, label: "Kopi", bg: "#2B2840" },
  { x: 93, y: 44, w: 5, h: 9, label: "", bg: "#4DBB72", extra: { borderRadius: "50%" } },
  { x: 2, y: 14, w: 5, h: 9, label: "", bg: "#4DBB72", extra: { borderRadius: "50%" } },
];

/** Home desk per bot. */
export const ST: Record<string, [number, number]> = {
  oren: [18, 36],
  biru: [42, 36],
  kunyit: [66, 36],
  lila: [88, 34],
  ijo: [13, 90],
  pinky: [33, 92],
  printer: [50, 62],
  kamu: [61, 84],
};

/** Each bot's patrol route: `[stop, caption]`. */
export const ROUTE: Record<string, [string, string][]> = {
  Oren: [
    ["oren", "bikin invoice"],
    ["ijo", "ambil data rekap"],
    ["oren", "hitung total"],
    ["printer", "cetak invoice"],
  ],
  Biru: [
    ["biru", "balas chat"],
    ["biru", "kirim resi"],
    ["ijo", "cek status pesanan"],
  ],
  Lila: [
    ["lila", "atur jadwal"],
    ["lila", "cari slot rapat"],
    ["kunyit", "titip undangan"],
  ],
  Ijo: [
    ["ijo", "rekap pesanan"],
    ["biru", "ambil pesanan baru"],
    ["ijo", "perbarui stok"],
  ],
  Pinky: [
    ["pinky", "rapikan arsip"],
    ["printer", "ambil hasil scan"],
    ["pinky", "ganti nama file"],
  ],
  Kunyit: [
    ["kunyit", "pilah email"],
    ["oren", "ambil lampiran invoice"],
    ["kunyit", "tulis draf balasan"],
  ],
};

export const HOME: Record<string, string> = {
  Oren: "oren",
  Biru: "biru",
  Lila: "lila",
  Ijo: "ijo",
  Pinky: "pinky",
  Kunyit: "kunyit",
};

export const PLACE: Record<string, string> = {
  oren: "meja invoice",
  biru: "meja WhatsApp",
  kunyit: "meja email",
  lila: "papan jadwal",
  ijo: "rak rekap",
  pinky: "lemari arsip",
  printer: "printer",
  kamu: "meja persetujuanmu",
};

export const SOFA: [number, number][] = [
  [80, 74],
  [88, 74],
  [95, 76],
  [84, 58],
];
export const QUEUE: [number, number][] = [
  [56, 93],
  [63, 93],
  [70, 93],
  [49, 93],
];
export const BEAN: [number, number][] = [
  [92, 95],
  [83, 95],
];
