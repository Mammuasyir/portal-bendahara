# Phase 04: Modul Kantin Cashless & Transaksi QR

## 1. Objective
Mengembangkan ekosistem kantin *cashless* yang mencakup saldo digital real-time, alur top-up saldo dengan validasi minimal `Rp50.000`, linimasa mutasi saldo gabungan (top-up & jajan), serta tampilan QR Code pembayaran / simulasi transaksi kasir kantin.

---

## 2. Scope & Relevant Areas
- Type definitions: `src/types/canteen.ts`.
- Mock data fixtures: `src/data/mockCanteen.ts` (Saldo siswa & riwayat mutasi).
- Service adapter: `src/services/canteenService.ts`.
- Komponen Kantin:
  - Kartu saldo kantin real-time (`CanteenBalanceCard`).
  - Modal top-up saldo (`TopUpModal`) dengan selector nominal cepat (`Rp50rb`, `Rp100rb`, `Rp200rb`, `Rp500rb`) & input kustom.
  - Validasi frontend: Tolak nominal < `Rp50.000` dan tolak transaksi belanja jika `saldo < nominal belanja`.
  - Linimasa riwayat mutasi gabungan (`MutationHistoryList`) menggunakan `TransactionCard` terpadu.
  - Kartu QR Code pembayaran siswa (`StudentQRCard`) dan modal simulasi kasir scan bayar.

---

## 3. Reference Documents
- Requirements & Validations: [`docs/prd.md`](file:///c:/Users/mammu/portal-bendahara/docs/prd.md) (FR-KTN-01 s/d FR-KTN-04)
- Currency Formatters & Modal: [`docs/uiguideline.md`](file:///c:/Users/mammu/portal-bendahara/docs/uiguideline.md)
- Service Adapter Pattern: [`docs/implementation.md`](file:///c:/Users/mammu/portal-bendahara/docs/implementation.md)

---

## 4. Acceptance Criteria
- [x] Saldo kantin tampil real-time dan terformat Rupiah standar (`Rp150.000`).
- [x] Form top-up menolak input di bawah `Rp50.000` dengan pesan validasi yang jelas.
- [x] Top-up memicu modal konfirmasi sebelum saldo bertambah.
- [x] Histori mutasi menampilkan top-up (+) dan belanja (-) dalam satu list kronologis dengan tag pembeda warna.
- [x] Transaksi belanja tidak dapat diproses jika nominal belanja melebihi saldo aktif (saldo tidak pernah minus).
- [x] QR Code siswa dapat ditampilkan dengan jelas dan memiliki tombol simulasi *"Scan & Bayar"* untuk pengujian.

---

## 5. Verification Steps
1. Uji top-up nominal `Rp30.000` -> Pastikan validasi error muncul.
2. Uji top-up nominal `Rp100.000` -> Pastikan modal konfirmasi muncul, dan setelah dikonfirmasi, saldo bertambah `Rp100.000`.
3. Uji simulasi belanja kantin melebihi saldo -> Pastikan sistem menolak transaksi.
4. Periksa linimasa histori mutasi saldo gabungan.

---

**Dependencies**: [Phase 01](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-01.md), [Phase 02](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-02.md)  
**Status**: `COMPLETED`
