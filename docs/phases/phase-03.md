# Phase 03: Modul SPP & Pencatatan Pengeluaran Sekolah

## 1. Objective
Mengembangkan modul manajemen SPP (status tagihan, alur pembayaran mock gateway dengan modal konfirmasi, histori pembayaran berfilter, status notifikasi WA) dan modul pembukuan pengeluaran sekolah untuk Admin/TU.

---

## 2. Scope & Relevant Areas
- Type definitions: `src/types/spp.ts` & `src/types/expense.ts`.
- Mock data fixtures: `src/data/mockSPP.ts` & `src/data/mockExpenses.ts`.
- Service adapters: `src/services/sppService.ts` & `src/services/expenseService.ts`.
- Komponen SPP:
  - Kartu ringkasan tagihan (`SPPBillCard`).
  - Modal pembayaran SPP terintegrasi `ConfirmActionModal`.
  - Tabel/Daftar riwayat pembayaran SPP dengan filter bulan dan tahun ajaran.
  - Badge status pengiriman notifikasi WhatsApp (*read-only*).
- Komponen Pengeluaran Sekolah (Khusus Admin/TU):
  - Form pencatatan pengeluaran baru (Nama, Nominal, Tanggal, Kategori, Keterangan).
  - Daftar riwayat pengeluaran dengan filter kategori (`Operasional`, `Gaji`, `Sarana`, `Konsumsi`, `Lain-lain`) dan rentang tanggal.

---

## 3. Reference Documents
- Requirements: [`docs/prd.md`](file:///c:/Users/mammu/portal-bendahara/docs/prd.md) (FR-SPP-01 s/d FR-SPP-05)
- Reusable Card & Modal: [`docs/uiguideline.md`](file:///c:/Users/mammu/portal-bendahara/docs/uiguideline.md)
- Mock Data Flow: [`docs/implementation.md`](file:///c:/Users/mammu/portal-bendahara/docs/implementation.md)

---

## 4. Acceptance Criteria
- [x] Tagihan SPP menampilkan status yang jelas (`Lunas`, `Belum Bayar`, `Jatuh Tempo`).
- [x] Pembayaran tagihan memicu modal konfirmasi sebelum status tagihan berubah menjadi `Lunas`.
- [x] Riwayat SPP dapat difilter berdasarkan bulan dan tahun ajaran.
- [x] Status notifikasi WA tampil akurat (misal: "Terkirim pada 01/08/2026 08:30").
- [x] Admin/TU dapat menambahkan pengeluaran baru dan langsung muncul pada daftar pengeluaran.
- [x] Filter kategori pengeluaran berfungsi memfilter data secara instan.

---

## 5. Verification Steps
1. Simulasikan pembayaran tagihan SPP seorang siswa dan pastikan modal konfirmasi muncul.
2. Tambahkan entri pengeluaran baru sebagai Admin, verifikasi nominal terformat Rupiah.
3. Uji filter bulan pada riwayat SPP dan filter kategori pada pengeluaran.

---

**Dependencies**: [Phase 01](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-01.md), [Phase 02](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-02.md)  
**Status**: `COMPLETED`
