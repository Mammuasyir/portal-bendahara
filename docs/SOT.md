# Global Source of Truth (SOT)

## 1. Project Overview & Global Facts
- **Project Name**: Portal Bendahara & Keuangan Sekolah (SPP & Kantin Cashless)
- **Domain**: Keuangan Sekolah Berasrama (Boarding School Finance Management)
- **Core Value**: Digitalisasi penagihan & pembayaran SPP terintegrasi WhatsApp reminder serta ekosistem kantin cashless berbasis QR & saldo real-time.
- **Target Users**: Orang Tua / Wali Siswa, Siswa Asrama, Admin Keuangan / TU Sekolah.
- **Tech Stack Baseline**: React + Vite (TypeScript), Tailwind CSS, Lucide React Icons.
- **Architecture**: Single Page Application (SPA) Frontend-Only dengan Mock API Layer (`// TODO: replace with real API`).

---

## 2. Authoritative Document Mapping
Gunakan tabel ini untuk navigasi informasi otoritatif. Dilarang menduplikasi konten antar dokumen.

| Kategori Informasi | Dokumen Otoritatif | Cakupan Utama |
| :--- | :--- | :--- |
| **Operasional AI & Workflow** | [`AGENTS.md`](file:///c:/Users/mammu/portal-bendahara/AGENTS.md) | Aturan kerja agen, context efficiency, anti-overengineering, DoD |
| **Global Truth & Status** | [`docs/SOT.md`](file:///c:/Users/mammu/portal-bendahara/docs/SOT.md) | Fakta global, routing dokumen, urutan fase, phase aktif |
| **Product & Business Logic (WHAT/WHY)** | [`docs/prd.md`](file:///c:/Users/mammu/portal-bendahara/docs/prd.md) | User persona, requirements, alur proses, aturan bisnis, batasan |
| **UI/UX & Design Tokens** | [`docs/uiguideline.md`](file:///c:/Users/mammu/portal-bendahara/docs/uiguideline.md) | Design tokens, palet warna, tipografi, reusable component, layout |
| **Teknis & Arsitektur (HOW)** | [`docs/implementation.md`](file:///c:/Users/mammu/portal-bendahara/docs/implementation.md) | Struktur folder, state strategy, mock service adapter, formatters |
| **Spesifikasi Phase Aktif** | `docs/phases/phase-XX.md` | Objective, scope, acceptance criteria, verifikasi phase aktif |

---

## 3. Global Non-Negotiable Constraints
1. **Frontend-Only**: Tidak ada backend runtime; gunakan typed mock service adapter.
2. **Financial Rules**:
   - Saldo kantin tidak boleh negatif (`saldo >= 0`).
   - Top-up minimal `Rp50.000`.
   - Setiap transaksi finansial (bayar SPP, top-up) wajib melalui modal konfirmasi.
3. **Format Standar**:
   - Mata uang: `Rp1.000.000` (tanpa spasi setelah Rp, titik pemisah ribuan).
   - Tanggal: Format Indonesia (`DD/MM/YYYY` atau `DD MMMM YYYY`).
4. **Role Isolation**:
   - Admin/TU: Rekap total SPP, kelola pengeluaran belanja kas sekolah, monitoring kantin global.
   - Staff Kantin: Kasir POS transaksi santri, loket setor top-up saldo saku santri.
   - Orang Tua: Hanya data SPP & saldo saku anak yang terhubung.
   - Siswa: Hanya data saku & QR kantin pribadi.
5. **UX First**: Mobile-first design, bahasa antarmuka bahasa Indonesia formal-santun.

---

## 4. Phase Plan & Current Execution Status
Pelaksanaan dilakukan secara bertahap dan terisolasi:

- [x] **Phase 01**: [Setup Pondasi, Design System & Base Layout](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-01.md)
- [x] **Phase 02**: [Autentikasi Multi-Role & Route Guarding](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-02.md)
- [x] **Phase 03**: [Modul SPP & Pencatatan Pengeluaran Sekolah](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-03.md)
- [x] **Phase 04**: [Modul Kantin Cashless & Transaksi QR](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-04.md)
- [x] **Phase 05**: [Role-Based Dashboard & Action Views](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-05.md)
- [ ] **Phase 06**: [Integrasi End-to-End, Mock Seed Data & Polish](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-06.md)

**Current Phase**: `Phase 06: Integrasi End-to-End, Mock Seed Data & Polish`  
**Status**: Siap untuk eksekusi Phase 06.
