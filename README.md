# 🏛️ Portal Bendahara & Keuangan Pesantren

Aplikasi web modern berbasis **React 18 + Vite (TypeScript)** untuk digitalisasi manajemen keuangan sekolah berasrama / pesantren. Mengintegrasikan penagihan & pelunasan SPP 12 bulan berbasis pemotongan saldo tabungan, pengelolaan rekening santri (uang saku & SPP via Bank Virtual Account), kasir POS belanja santri (*cashless*), serta notifikasi WhatsApp otomatis terhubung ke Evolution API.

---

## 🌟 Fitur Utama

### 1. 📊 Matriks Rekapitulasi SPP 12 Bulan (`/rekap-spp`)
- **Visualisasi Matriks 12 Bulan**: Status pembayaran bulanan (Juli s/d Juni) untuk setiap santri (*Lunas*, *Menunggak*, *Belum Jatuh Tempo*).
- **Ketentuan Tahun Ajaran (`thang`)**: Format `{tahun_awal}_{semester}` (misal `2025_1`, `2025_2`, `2026_1`, `2026_2`). Perhitungan SPP 12 bulan berbasis pada `baseYear` (tahun awal).
- **Metode Pembayaran Tunggal (Potong Saldo)**: Pelunasan SPP dieksekusi murni via pemotongan saldo tabungan santri (`kategori: "0"`).
- **Proteksi Saldo Otomatis**: Tombol simpan pembayaran otomatis **Disabled** dengan indikator visual jika saldo tabungan santri tidak mencukupi.

### 2. 💳 Tabungan & Rekening Santri (`/tabungan`)
- **Pemisahan Alur Uang Saku & SPP**:
  - **Setoran Uang Saku (+)**: Dilakukan oleh bendahara melalui loket kasir untuk titipan uang saku harian santri.
  - **Setoran SPP (+)**: Dilakukan oleh wali santri langsung via transfer ke rekening Virtual Account (VA) Bank dan ditarik otomatis via API Bank.
  - **Penarikan Uang Saku / SPP (-)**: Eksekusi pemotongan saldo tabungan santri dengan validasi batas saldo (`saldo >= nominal`).
- **Sinkronisasi Saldo Real-Time**: Perhitungan saldo berjalan dari mutasi terakhir backend (`GET /api/staff/save-money/init`).

### 3. 🛍️ Belanja Santri Cashless / POS Kasir (`/belanja`)
- **Pencarian Santri Cepat**: Berdasarkan NISN, Nama Lengkap, atau Filter Kelas.
- **Transaksi Kasir Instan**: Input nominal belanja dan verifikasi saldo santri secara *real-time*.

### 4. 📲 Notifikasi WhatsApp Otomatis (`Evolution API`)
- Terintegrasi dengan endpoint `POST /api/staff/whatsapp/send`.
- Nomor telepon tujuan diambil secara dinamis dari field **`phone`** user santri.
- Pesan WhatsApp resmi otomatis terkirim setiap kali terjadi:
  1. **Setoran Uang Saku (+)**
  2. **Penarikan Uang Saku (-)**
  3. **Pelunasan SPP Bulanan (Potong Saldo)**

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling Engine**: [Tailwind CSS v3](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **HTTP Client**: Native Fetch Wrapper (`apiClient.ts`) dengan Bearer Token Authentication

---

## 📁 Struktur Folder

```
portal-bendahara/
├── docs/                      # Dokumentasi Arsitektur & SOT
│   ├── SOT.md                 # Single Source of Truth
│   ├── prd.md                 # Product Requirements Document
│   ├── uiguideline.md         # UI/UX & Design Tokens
│   ├── implementation.md      # Panduan Teknis & Endpoint API
│   └── phases/                # Riwayat Fase Pengerjaan (Phase 01–06)
├── src/
│   ├── components/            # Reusable UI (Button, Input, Modal, Layout)
│   ├── context/               # Global Context (AuthContext)
│   ├── features/              # Modul Fitur
│   │   ├── auth/              # Halaman Login
│   │   ├── tabungan/          # Modul Rekening & Tabungan Santri
│   │   ├── rekapSpp/          # Modul Rekap & Pelunasan SPP 12 Bulan
│   │   ├── belanja/           # Modul POS Belanja Santri
│   │   └── dashboard/         # Dashboard Utama
│   ├── services/              # Integrasi REST API & WhatsApp
│   │   ├── apiClient.ts       # HTTP Client Helper
│   │   ├── authService.ts     # Auth API
│   │   ├── tabunganService.ts # API Save Money
│   │   ├── rekapSppService.ts # Matrix SPP & Thang Resolver
│   │   ├── belanjaService.ts  # API Belanja Santri
│   │   └── whatsappService.ts # API WhatsApp Evolution
│   ├── types/                 # TypeScript Interfaces
│   └── utils/                 # Formatters (Rupiah, Tanggal) & Class Helpers
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
Pastikan telah terinstal:
- [Node.js](https://nodejs.org/) (versi 18+ direkomendasikan)
- `npm` atau `yarn`

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment (Opsional)
Buat file `.env` di root direktori jika ingin mengarahkan API Base URL:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_MODE=live
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173`.

### 5. Build Produksi
```bash
npm run build
```
File hasil build akan berada di direktori `dist/`.

---

## 📄 Kontrak Endpoint API Backend

| Endpoint | Method | Keterangan |
| :--- | :---: | :--- |
| `/api/login` | `POST` | Autentikasi user & perolehan Bearer token |
| `/api/user` | `GET` | Profil user aktif dari Bearer token |
| `/api/staff/save-money/init` | `GET` | Data santri, tombol kelas, dan riwayat mutasi rekening |
| `/api/staff/save-money/store` | `POST` | Mutasi tabungan (`kategori: 1` = Setor, `0` = Tarik/SPP) |
| `/api/staff/belanja-santri/init` | `GET` | Data santri dan riwayat transaksi belanja kasir |
| `/api/staff/belanja-santri/store`| `POST` | Pencatatan transaksi belanja santri di kasir |
| `/api/staff/whatsapp/send` | `POST` | Pengiriman pesan WhatsApp ke nomor wali santri |

---

## 📝 Lisensi & Hak Cipta
Dikembangkan untuk Portal Manajemen Keuangan Pesantren & Boarding School.
