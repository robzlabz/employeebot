# Employee Bot

Bots that do human tasks. Setiap bot punya **komputer virtual** dan **sesi persisten** — bukan sekadar chat.

## Product vision

Employee Bot adalah platform bot yang mengerjakan pekerjaan manusia (konsep seperti Grok Bot). Setiap bot adalah satu karakter bulat yang lucu — dua mata dan satu mulut — dengan komputer sendiri.

**Core**

- Login owner perusahaan + onboarding (tujuan bisnis, siapa mereka).
- Satu user bisa punya banyak perusahaan (1 user → many companies).
- Satu perusahaan bisa punya banyak bot (1 company → many bots), dan **setiap bot = satu komputer**.
- Bot berkolaborasi dalam grup dan berbagi satu workspace.

**Bot traits**

- Karakter bulat lucu: 2 mata + mulut.
- Catatan personal dan catatan global.
- Auto-learn perilaku user.
- Akses secrets / environment.
- Komputer, terminal, dan browser — dengan persistence.

**Billing**

Indonesia dulu: transfer bank / virtual account. **Tidak ada Stripe.**

## Status

Marketing site (scaffold). Halaman yang ada:

| Route        | Isi                                                       |
| ------------ | --------------------------------------------------------- |
| `/`          | Hero + ilustrasi 8 bot yang berkumpul & berdiskusi (CSS/SVG animasi), feature strip |
| `/pricing`   | Tier placeholder (Free / Pro / Team), catatan billing transfer bank |
| `/dashboard` | Placeholder "Dashboard coming soon"                       |

Belum ada auth, backend, atau integrasi pembayaran. Tidak ada secret atau `.env` yang dibutuhkan.

## Menjalankan

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>.

Build produksi:

```bash
npm run build
npm start
```

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Animasi murni CSS/SVG — tanpa file gambar, tanpa library animasi

## Struktur

```
src/
  app/
    layout.tsx          # shell: header, footer, metadata
    page.tsx            # homepage
    globals.css         # theme tokens + keyframes (bob, blink, bubble, rise)
    icon.svg            # favicon bot
    pricing/page.tsx
    dashboard/page.tsx
  components/
    bot.tsx             # karakter bot (SVG, mata berkedip, mulut, antena)
    bot-gathering.tsx   # 8 bot + chat bubble
    feature-grid.tsx    # 4 kartu fitur
    site-header.tsx     # nav: Home | Pricing | Dashboard
    site-footer.tsx
```
