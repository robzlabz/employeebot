# ADR 0001 — Temporal Cloud vs self-host, dan region penyimpanan data

- Status: **Diterima**
- Tanggal: 2026-10-09
- Task: E1.1 (`#13`)
- Konteks dokumen: *Bolu — Arsitektur Sistem dan Backend* → "Keputusan yang masih terbuka":
  - `Temporal Cloud atau self-host sejak awal?`
  - `Lokasi penyimpanan data: region Jakarta untuk kebutuhan UU PDP, atau Singapura?`

## Ringkasan keputusan

| Pertanyaan | Keputusan |
| --- | --- |
| Temporal | **Temporal Cloud** untuk `staging` dan `prod`; **self-host di docker-compose** untuk `dev` |
| Region data | **Jakarta** (AWS `ap-southeast-3`) untuk Postgres, Redis, dan object storage |
| Region Temporal | **Singapore** (`aws-ap-southeast-1`) |
| Isi payload workflow | Workflow Temporal hanya membawa **referensi (ID)**, bukan isi pesan pelanggan (*claim check*) |

## 1. Temporal: Cloud untuk staging/prod, self-host untuk dev

**Fakta yang mengikat pilihan.** Temporal Cloud tidak punya region Jakarta. Region terdekat
adalah Singapore (`aws-ap-southeast-1`, endpoint `ap-southeast-1.aws.api.temporal.io:7233`)
dan Tokyo (`aws-ap-northeast-1`) — lihat [Service regions](https://docs.temporal.io/cloud/regions).
Self-host berarti kami mengurus cluster, upgrade, dan backup sendiri di atas Postgres.

**Keputusan.** Mulai dengan Temporal Cloud namespace di `aws-ap-southeast-1` untuk staging dan
prod. docker-compose tetap menjalankan Temporal self-host (image `temporalio/auto-setup` +
UI) supaya pengembangan lokal tidak butuh internet, kredensial, atau biaya, dan supaya alur
"worker restart lalu workflow lanjut" bisa diuji tanpa menyentuh Cloud.

**Alasan.**

- Pekerjaan agen berhenti di persetujuan manusia selama berjam-jam sampai berhari-hari. Itu
  justru beban yang paling mahal dirawat sendiri (retensi riwayat, arsip, upgrade skema).
- Tim awal fokus ke produk; mengurus cluster Temporal sendiri adalah biaya operasional tetap
  yang tidak menghasilkan fitur.
- Kode tidak berubah antara Cloud dan self-host: hanya `TEMPORAL_HOST_PORT` + kredensial
  (mTLS/API key) yang berbeda. Jadi keputusan ini murah untuk dibalik.

**Konsekuensi.**

- Ada biaya langganan (per action + storage) sejak awal, kecil dibanding biaya token LLM yang
  menjadi komponen biaya terbesar.
- Latensi worker (Jakarta) → Temporal (Singapore) ±15–25 ms per panggilan. Dapat diterima
  karena panggilan LLM jauh lebih lambat.
- Riwayat workflow di Cloud punya retensi bawaan; data yang wajib lama disimpan tetap
  ditulis ke Postgres kami (`task`, `task_summary`), bukan mengandalkan riwayat Temporal.
- Batas *action* per namespace dipantau lewat metrik Epic 13; bila volume melewati titik
  impas, self-host dievaluasi ulang. Migrasi hanya perlu mengganti endpoint (namespace baru)
  karena workflow memakai nama & versi yang sama.

## 2. Region data: Jakarta

**Keputusan.** Postgres terkelola (dengan `pgvector`), Redis, dan object storage berada di
region **Jakarta** (AWS `ap-southeast-3`; alternatif GCP `asia-southeast2`).

**Alasan.**

- UU PDP (UU No. 27/2022) tidak mewajibkan penyimpanan di dalam negeri, tetapi pelanggan
  UMKM Indonesia dan calon klien instansi akan menanyakannya. Menyimpan data pelanggan di
  Jakarta menghilangkan satu kelas keberatan dan satu kelas risiko.
- Region Jakarta sudah tersedia untuk semua komponen kecuali Temporal Cloud, jadi tidak ada
  alasan teknis untuk memilih Singapura.

**Konsekuensi.**

- Postgres + `pgvector`, Redis, dan object storage harus berada di region yang sama agar
  latensi antar-komponen rendah dan transfer data tidak keluar region.
- **Isi pesan pelanggan tidak boleh ikut ke Temporal Cloud.** Karena payload workflow
  dipersist oleh Temporal, workflow hanya membawa ID (`task_id`, `draft_id`, `message_id`);
  isi sebenarnya dibaca worker dari Postgres di Jakarta (*claim check*). Aturan ini juga
  membuat riwayat workflow tetap ringkas dan mudah dihapus saat permintaan hapus data
  (Epic 13) — menghapus baris Postgres sudah cukup untuk menghapus isinya.
- Bila kelak butuh penyimpanan di Singapura (misalnya karena harga), perubahan hanya di
  konfigurasi koneksi; tidak ada perubahan kode.

## 3. Dampak ke repositori

- `docker-compose.yml`: menambahkan `temporal` (self-host, `auto-setup`) + `temporal-ui`,
  Redis, dan Postgres ber-`pgvector`; worker `agent-worker` & `integration-worker` menunjuk
  ke Temporal lokal lewat `TEMPORAL_HOST_PORT`.
- `.env.example`: menyertakan `TEMPORAL_HOST_PORT`, `TEMPORAL_NAMESPACE`,
  `TEMPORAL_TLS`/API key sebagai komentar untuk staging/prod (Cloud Singapore).
- `config/config.yaml` (non-local): `Temporal.HostPort` kosong secara default supaya tidak ada
  endpoint produksi yang tertanam di repo; nilainya wajib datang dari environment.

## Keputusan yang tetap terbuka

Dua keputusan terbuka lain di dokumen **tidak** diselesaikan di sini karena bukan bagian
Epic 1 dan tidak memblokir infrastruktur:

- Isi tiap paket + harga paket tambahan token → Epic 12 (`#102`).
- Retensi `task_step` mentah dan lampiran → Epic 13 (`#107`).
