# Phase 06: Integrasi End-to-End, Mock Seed Data & Polish

## 1. Objective
Melakukan finalisasi dataset realistis (*seed mock fixtures*), penyempurnaan responsivitas mobile, pengujian *edge cases* finansial, perbaikan transisi/animasi, dan audit anti-overengineering.

---

## 2. Scope & Relevant Areas
- Penyusunan dataset demo yang komprehensif di `src/data/` (data siswa asrama, riwayat 6 bulan SPP, histori transaksi kantin, buku pengeluaran sekolah).
- Pengujian interaksi end-to-end seluruh role (Orang Tua, Siswa, Admin).
- Audit responsivitas pada layar mobile (360px, 390px, 414px) dan desktop (1440px).
- Audit empty states, error states, dan validasi form batas minimum/maksimum.
- Verifikasi kepatuhan terhadap [AGENTS.md](file:///c:/Users/mammu/portal-bendahara/AGENTS.md) dan [SOT.md](file:///c:/Users/mammu/portal-bendahara/docs/SOT.md).

---

## 3. Reference Documents
- Acceptance Matrix: [`docs/prd.md`](file:///c:/Users/mammu/portal-bendahara/docs/prd.md)
- Micro-interactions & States: [`docs/uiguideline.md`](file:///c:/Users/mammu/portal-bendahara/docs/uiguideline.md)
- Code Quality & Performance: [`docs/implementation.md`](file:///c:/Users/mammu/portal-bendahara/docs/implementation.md)

---

## 4. Acceptance Criteria
- [ ] Data demo terlihat realistis dan merefleksikan alur operasional sekolah berasrama asli.
- [ ] Tidak ada layout overflow atau elemen terpotong pada viewport mobile terkecil (360px).
- [ ] Semua modal konfirmasi berfungsi konsisten di seluruh modul.
- [ ] Format nominal mata uang dan tanggal konsisten di 100% tampilan antarmuka.
- [ ] Build produksi (`npm run build`) berjalan bersih tanpa warning atau error TypeScript.

---

## 5. Verification Steps
1. Jalankan pengujian interaktif end-to-end melintasi ketiga role.
2. Simulasikan skenario error (koneksi lambat, saldo pas-pasan, input tidak valid).
3. Jalankan `npm run build` dan `npm run lint`.

---

**Dependencies**: [Phase 01](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-01.md) s/d [Phase 05](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-05.md)  
**Status**: `PENDING`
