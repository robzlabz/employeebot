# Employee Bot

Bots that do human tasks. Setiap bot punya **komputer virtual** dan **sesi persisten** — bukan sekadar chat.

## Product vision

Employee Bot adalah platform bot yang mengerjakan pekerjaan manusia. Setiap bot adalah satu karakter bulat yang lucu — dua mata dan satu mulut — dengan komputer sendiri.

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

## Monorepo map

```
.
├── apps/
│   ├── backend/     # Go HTTP API — Fiber + sqlx + Postgres, cobra + viper config
│   └── frontend/    # Next.js (App Router) + TypeScript + Tailwind v4 marketing site
├── docker-compose.yml
├── Makefile
└── .env.example
```

`apps/backend` follows a modular layered layout: `cmd` (cobra commands) →
`config` (viper YAML + env overrides) → `internal/dependency` (wiring: driver,
repositories, services, handlers) → `internal/router` → `internal/module/*`
(domain / repository / service / handler / router per module). Migrations live
in `apps/backend/db/migrations`. Only the health module and the auth domain
stub exist today.

## How to run

```bash
cp .env.example .env
make up
```

The backend starts even when Postgres is unavailable — it logs a warning and
serves the health endpoints without a database connection.

| Service  | URL                            |
| -------- | ------------------------------ |
| Frontend | http://localhost:3000          |
| Backend  | http://localhost:8080/health   |
| Postgres | `localhost:5432` (`employeebot` / `employeebot_secret` / `employeebot`) |

### Running without Docker

```bash
make frontend   # cd apps/frontend && npm run dev
make backend    # cd apps/backend && go run . http
```

Install frontend dependencies inside `apps/frontend` (`npm ci`) — there is no
root `package.json`, so `npm install` at the repo root does nothing.

## Make targets

| Target     | Description                                    |
| ---------- | ---------------------------------------------- |
| `up`       | `docker compose up -d --build`                 |
| `down`     | `docker compose down`                          |
| `logs`     | `docker compose logs -f`                       |
| `build`    | `docker compose build`                         |
| `dev`      | `up` then follow logs                          |
| `frontend` | Next.js dev server on the host                 |
| `backend`  | Go HTTP server on the host                     |
| `migrate`  | Apply DB migrations (stub — golang-migrate TBD) |
| `help`     | List targets (default target)                  |

## Roadmap

GitHub issues **#1–#11** track the roadmap: auth, multi-company, bots, virtual
computer, groups, memory, secrets, billing, dashboard, marketing polish,
realtime room.

## Stack

- **Backend:** Go 1.24, Fiber v2, sqlx + lib/pq (Postgres 16), cobra, viper.
- **Frontend:** Next.js 16 (App Router) + TypeScript, Tailwind CSS v4, animasi
  murni CSS/SVG — tanpa file gambar, tanpa library animasi.
- **Local infra:** Docker Compose (`postgres`, `backend`, `frontend`).

Frontend routes today: `/` (hero + 8 bot), `/pricing` (tier placeholder, catatan
billing transfer bank), `/dashboard` (UI mock tanpa auth: lima view — dasbor,
rutinitas, kantor, integrasi, pengaturan — plus chat bot dan grup). Belum ada
auth, integrasi pembayaran, atau koneksi backend.
