# Global Source of Truth (SOT)

## 1. Project Overview & Global Facts
- **Project Name**: Portal Bendahara & Keuangan Pesantren (SPP, Tabungan, & Belanja Santri)
- **Domain**: Keuangan Sekolah Berasrama / Pesantren (Boarding School Finance Management)
- **Core Value**: Digitalisasi penagihan & pelunasan SPP 12 bulan berbasis pemotongan saldo tabungan, pengelolaan rekening santri (uang saku & SPP via Bank VA), POS belanja santri kasir, serta notifikasi WhatsApp otomatis terintegrasi Evolution API.
- **Target Users**: Bendahara / Admin TU, Petugas Kasir Belanja Santri, Wali Santri, dan Santri.
- **Tech Stack Baseline**: React 18 + Vite (TypeScript), Tailwind CSS, Lucide React Icons.
- **Architecture**: Single Page Application (SPA) Frontend yang terintegrasi langsung dengan Live Backend REST API Laravel (`/api/staff/*`) dan fallback offline yang tangguh.

---

## 2. Authoritative Document Mapping
Gunakan tabel ini untuk navigasi informasi otoritatif. Dilarang menduplikasi konten antar dokumen.

| Kategori Informasi | Dokumen Otoritatif | Cakupan Utama |
| :--- | :--- | :--- |
| **Operasional AI & Workflow** | [`AGENTS.md`](file:///c:/Users/mammu/portal-bendahara/AGENTS.md) | Aturan kerja agen, context efficiency, anti-overengineering, DoD |
| **Global Truth & Status** | [`docs/SOT.md`](file:///c:/Users/mammu/portal-bendahara/docs/SOT.md) | Fakta global, routing dokumen, urutan fase, status aktif |
| **Product & Business Logic (WHAT/WHY)** | [`docs/prd.md`](file:///c:/Users/mammu/portal-bendahara/docs/prd.md) | User persona, requirements, alur proses, aturan bisnis, batasan |
| **UI/UX & Design Tokens** | [`docs/uiguideline.md`](file:///c:/Users/mammu/portal-bendahara/docs/uiguideline.md) | Design tokens, palet warna, tipografi, reusable component, layout |
| **Teknis & Arsitektur (HOW)** | [`docs/implementation.md`](file:///c:/Users/mammu/portal-bendahara/docs/implementation.md) | Struktur folder, endpoint API, state strategy, formatters, WhatsApp |
| **Spesifikasi Phase** | `docs/phases/phase-XX.md` | Objective, scope, acceptance criteria per tahapan pengerjaan |

---

## 3. Global Non-Negotiable Constraints
1. **Frontend Integration**: Terhubung langsung ke Backend API (`/api/login`, `/api/staff/save-money/*`, `/api/staff/belanja-santri/*`, `/api/staff/whatsapp/send`).
2. **Financial Rules**:
   - **Kategori Sirkulasi Tabungan**:
     - `kategori: "1"` ➔ Pemasukan / Setoran (`Menabung (+)`).
     - `kategori: "0"` ➔ Pengeluaran / Penarikan (`Mengambil (-)`).
   - **Alur Setor SPP**: Top up / setoran dana SPP murni dilakukan via transfer Virtual Account (VA) Bank wali santri dan disinkronkan otomatis via API Bank. Form Setor (+) admin hanya untuk **Setoran Uang Saku**.
   - **Alur Bayar SPP**: Pelunasan SPP di Dashboard SPP dilakukan dengan metode tunggal **Potong Saldo Tabungan Santri** (`kategori: "0"` bertag `spp`).
   - Saldo tabungan santri tidak boleh negatif (`saldo >= 0`). Tombol transaksi otomatis disabled jika saldo tidak mencukupi.
3. **Ketentuan Thang (Tahun Anggaran)**:
   - Format: `{tahun_awal}_{semester}` (contoh: `2025_1`, `2025_2`, `2026_1`, `2026_2`).
   - Untuk modul SPP, perhitungan dilakukan 12 bulan penuh berbasis `baseYear` (tahun awal dari `thang`).
4. **Notifikasi WhatsApp**:
   - Setiap mutasi finansial (Setor Uang Saku, Tarik Uang Saku, Pelunasan SPP) otomatis memicu pengiriman notifikasi WhatsApp ke nomor yang tertera pada field `phone` user santri via `POST /api/staff/whatsapp/send`.
5. **Format Standar**:
   - Mata uang: `Rp1.000.000` (tanpa spasi setelah Rp, titik pemisah ribuan).
   - Tanggal: Format Indonesia (`DD/MM/YYYY` atau `DD MMMM YYYY`).

---

## 4. Phase Plan & Execution Status
Pelaksanaan proyek telah tuntas melintasi seluruh modul utama:

- [x] **Phase 01**: [Setup Pondasi, Design System & Base Layout](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-01.md)
- [x] **Phase 02**: [Autentikasi Multi-Role & Route Guarding](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-02.md)
- [x] **Phase 03**: [Modul SPP & Pencatatan Pengeluaran Sekolah](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-03.md)
- [x] **Phase 04**: [Modul Kantin Cashless & Transaksi QR](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-04.md)
- [x] **Phase 05**: [Role-Based Dashboard & Action Views](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-05.md)
- [x] **Phase 06**: [Integrasi End-to-End, Live Backend, & Polish](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-06.md)

**Status Saat Ini**: `COMPLETED` (Produksi Siap Digunakan & Terverifikasi Build).
