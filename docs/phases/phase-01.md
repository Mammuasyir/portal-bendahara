# Phase 01: Setup Pondasi, Design System & Base Layout

## 1. Objective
Menginisialisasi proyek React + Vite (TypeScript), mengonfigurasi Tailwind CSS sesuai design token, menyusun struktur folder standar, dan membuat komponen dasar (*common components* & *layout shell*).

---

## 2. Scope & Relevant Areas
- Inisialisasi package & build tooling (Vite + React + TS + Tailwind + Lucide React).
- Setup token warna dan tipografi di [uiguideline.md](file:///c:/Users/mammu/portal-bendahara/docs/uiguideline.md).
- Pembuatan utility dasar ([formatters.ts](file:///c:/Users/mammu/portal-bendahara/docs/implementation.md#4-standard-formatters--pure-utilities)): `formatRupiah()` dan `formatDate()`.
- Pembuatan reusable base components: `Button`, `Badge`, `Input`, `ConfirmActionModal`, `Skeleton`.
- Pembuatan app layout shell: `Navbar`, `Sidebar` (Desktop), `BottomNav` (Mobile), `AppLayout`.

---

## 3. Reference Documents
- Design System: [`docs/uiguideline.md`](file:///c:/Users/mammu/portal-bendahara/docs/uiguideline.md)
- Arsitektur & Folder: [`docs/implementation.md`](file:///c:/Users/mammu/portal-bendahara/docs/implementation.md)
- Aturan Kerja AI: [`AGENTS.md`](file:///c:/Users/mammu/portal-bendahara/AGENTS.md)

---

## 4. Acceptance Criteria
- [x] Proyek dapat dijalankan secara lokal (`npm run dev`) tanpa error atau warning.
- [x] Utility `formatRupiah(1000000)` mengembalikan output persis `Rp1.000.000`.
- [x] Utility `formatDate("2026-08-12")` mengembalikan output format Indonesia yang valid.
- [x] Komponen `ConfirmActionModal` dapat menerima prop judul, deskripsi, nominal, dan aksi konfirmasi.
- [x] Layout responsif: Menampilkan BottomNav pada layar mobile (<768px) dan Sidebar pada layar desktop (>=1024px).
- [x] Tidak ada dependency eksternal yang tidak diperlukan selain yang disepakati.

---

## 5. Verification Steps
1. Jalankan type checking: `npm run build` / `tsc --noEmit`.
2. Inspect layout pada resolusi Mobile (375px) dan Desktop (1280px).
3. Verifikasi rendering komponen dasar pada *preview shell*.

---

**Status**: `COMPLETED`

