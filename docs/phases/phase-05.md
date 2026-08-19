# Phase 05: Role-Based Dashboard & Action Views

## 1. Objective
Mengintegrasikan komponen SPP dan Kantin ke dalam dashboard khusus masing-masing role (Orang Tua, Siswa, Admin/TU) sesuai matriks hak akses dan kebutuhan operasional.

---

## 2. Scope & Relevant Areas
- **Dashboard Orang Tua (`ParentDashboardPage`)**:
  - Ringkasan status SPP anak (Tagihan aktif, total belum bayar, riwayat).
  - Ringkasan saldo kantin anak & tombol top-up instan.
  - Linimasa aktivitas finansial anak terpadu.
- **Dashboard Siswa (`StudentDashboardPage`)**:
  - Kartu saldo kantin siswa & QR ID untuk jajan.
  - Histori jajan dan top up saldo pribadi.
  - Tidak menampilkan data SPP keluarga atau pengeluaran sekolah.
- **Dashboard Admin/TU (`AdminDashboardPage`)**:
  - Statistik agregat: Total penerimaan SPP vs Total pengeluaran sekolah.
  - Tabel rekapitulasi status SPP seluruh siswa (dengan filter kelas & status lunas).
  - Ringkasan transaksi & omzet kantin harian.
  - Akses cepat input pengeluaran sekolah.

---

## 3. Reference Documents
- Role-based Requirements: [`docs/prd.md`](file:///c:/Users/mammu/portal-bendahara/docs/prd.md) (FR-VIEW-01 s/d FR-VIEW-03)
- Dashboard Layout & Stat Cards: [`docs/uiguideline.md`](file:///c:/Users/mammu/portal-bendahara/docs/uiguideline.md)
- Role Routing & Data Aggregators: [`docs/implementation.md`](file:///c:/Users/mammu/portal-bendahara/docs/implementation.md)

---

## 4. Acceptance Criteria
- [x] Orang tua dapat melihat tagihan SPP dan saldo kantin anak dari satu layar terintegrasi.
- [x] Siswa hanya melihat saldo kantin dan QR miliknya tanpa melihat data pengeluaran sekolah.
- [x] Admin/TU melihat grafik/kartu ringkasan keuangan makro (SPP masuk, pengeluaran keluar, kas bersih).
- [x] Seluruh aksi finansial di dashboard (Bayar SPP dari dashboard orang tua, Top Up kantin) terhubung langsung ke modal konfirmasi.

---

## 5. Verification Steps
1. Login sebagai Orang Tua: Pastikan hanya data anak yang tampil dan tombol Bayar/Top Up berfungsi.
2. Login sebagai Siswa: Pastikan tampilan simpel khusus kantin dan tidak ada menu admin/SPP.
3. Login sebagai Admin/TU: Pastikan data makro sekolah teragregasi dengan benar.

---

**Dependencies**: [Phase 01](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-01.md), [Phase 02](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-02.md), [Phase 03](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-03.md), [Phase 04](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-04.md)  
**Status**: `COMPLETED`
