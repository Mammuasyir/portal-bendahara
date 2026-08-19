# Phase 06: Integrasi End-to-End, Live Backend, & Final Polish

## 1. Objective
Melakukan integrasi penuh dengan Live Backend REST API Laravel, finalisasi alur pelunasan SPP 12 bulan berbasis pemotongan saldo tabungan, pengelolaan rekening uang saku, POS belanja santri, serta pengiriman notifikasi WhatsApp otomatis terhubung ke Evolution API.

---

## 2. Scope & Completed Items
- **Integrasi Live Backend**:
  - `POST /api/login` & `GET /api/user` (Autentikasi Bearer Token).
  - `GET /api/staff/save-money/init` & `POST /api/staff/save-money/store` (Tabungan & SPP).
  - `GET /api/staff/belanja-santri/init` & `POST /api/staff/belanja-santri/store` (Belanja Santri).
  - `POST /api/staff/whatsapp/send` (Notifikasi WhatsApp ke nomor `phone` wali santri).
- **Penyesuaian Logika Finansial SPP & Tabungan**:
  - Pemisahan tegas: Top-up SPP dialihkan via transfer Bank VA, form Setor (+) admin murni untuk Uang Saku.
  - Pelunasan SPP di Dashboard SPP dikunci murni via Potong Saldo Tabungan (`kategori: "0"`).
  - Auto-disable button saat saldo tabungan santri tidak mencukupi untuk pemotongan SPP.
  - Sinkronisasi status Lunas (🟢) 12 bulan SPP berbasis `thang` tahun awal (`baseYear`).
- **Notifikasi WhatsApp Otomatis**:
  - Terkirim otomatis saat Setoran Uang Saku (+), Penarikan Uang Saku (-), dan Pelunasan SPP.
- **Audit Kode & Build**:
  - Lolos uji build produksi TypeScript & Vite (`npm run build`).

---

## 3. Acceptance Criteria Verification
- [x] Transaksi penarikan/pemotongan SPP mengirimkan `kategori: "0"` dan mengurangi saldo santri di backend.
- [x] Dashboard SPP menampilkan matriks 12 bulan yang akurat sesuai tahun ajaran (`thang`).
- [x] Metode pembayaran SPP tunggal: "Potong Saldo Tabungan Santri" dengan proteksi saldo.
- [x] Form Setor (+) admin murni hanya untuk Uang Saku Santri.
- [x] Notifikasi WhatsApp terkirim ke nomor santri (`phone`) pada setiap transaksi finansial.
- [x] Build produksi (`npm run build`) berjalan bersih 100% tanpa error.

---

**Status**: `COMPLETED` ✅
