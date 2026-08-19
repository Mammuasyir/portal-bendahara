# Technical Implementation Plan & Architecture

Dokumen ini menjelaskan aspek teknis arsitektur (*HOW*), standar kode, struktur folder, integrasi live backend REST API, dan modul WhatsApp untuk Portal Bendahara & Keuangan Pesantren.

---

## 1. Technology Stack & Dependencies

| Layer / Kebutuhan | Teknologi Terpilih | Catatan Implementasi |
| :--- | :--- | :--- |
| **Framework / Bundler** | React 18 + Vite (TypeScript) | SPA performa tinggi, modular, fast HMR, type-safe |
| **Styling Engine** | Tailwind CSS v3 | Design system konsisten, responsif mobile & desktop |
| **Icon Library** | Lucide React | Modern, clean, dan *tree-shakeable* |
| **HTTP Client** | `apiClient.ts` (Fetch Wrapper) | Mendukung JSON & `FormData` multipart dengan Bearer token |
| **Backend REST API** | Laravel Staff API | Endpoints `/api/login`, `/api/staff/save-money/*`, `/api/staff/belanja-santri/*`, `/api/staff/whatsapp/send` |
| **State Management** | React Context (AuthContext) + Feature Hooks | Ringan, terpusat, tanpa overhead library kompleks |

---

## 2. Directory Structure

```
portal-bendahara/
├── docs/                      # Dokumentasi Proyek & SOT
│   ├── SOT.md
│   ├── prd.md
│   ├── uiguideline.md
│   ├── implementation.md
│   └── phases/
│       ├── phase-01.md s/d phase-06.md
├── src/
│   ├── components/            # Reusable UI Components
│   │   ├── common/            # Button, Badge, Input, Modal, ConfirmActionModal
│   │   ├── layout/            # Layout, Navbar, Sidebar, Header
│   ├── context/               # AuthContext (Session Token & User Role)
│   ├── features/              # Feature Pages & Components
│   │   ├── auth/              # LoginPage (API /api/login)
│   │   ├── tabungan/          # TabunganPage (Rekening Santri, Setor Uang Saku, Tarik SPP/Uang Saku)
│   │   ├── rekapSpp/          # RekapSPPPage (Matriks 12 Bulan SPP, Potong Saldo, WA Reminder)
│   │   ├── belanja/           # BelanjaPage (POS Kasir Belanja Santri)
│   │   └── dashboard/         # Dashboard Utama
│   ├── services/              # API Client & Backend Adapters
│   │   ├── apiClient.ts       # Central HTTP Request Helper (Bearer Token Auth)
│   │   ├── authService.ts     # POST /api/login, GET /api/user
│   │   ├── tabunganService.ts # GET /api/staff/save-money/init, POST /api/staff/save-money/store
│   │   ├── rekapSppService.ts # Matrix SPP 12 Bulan, Thang Resolver, Pembayaran SPP
│   │   ├── belanjaService.ts  # GET /api/staff/belanja-santri/init, POST /api/staff/belanja-santri/store
│   │   └── whatsappService.ts # POST /api/staff/whatsapp/send (Evolution API)
│   ├── types/                 # TypeScript Types & Interfaces
│   │   ├── backend.ts         # User, SaveMoneyTransaction, BelanjaTransaction, ClassButton
│   │   ├── rekapSpp.ts        # StudentSPPRecord, SPPMonthRecord, RekapSPPStats
│   │   └── auth.ts            # AuthState, Credentials
│   ├── utils/                 # Pure Utilities
│   │   ├── classHelper.ts     # Normalisasi kelas santri & filter tombol
│   │   └── formatters.ts      # formatRupiah(), formatDate()
│   ├── App.tsx                # Routing & Route Guarding
│   ├── index.css              # Global Directives & Theme
│   └── main.tsx               # Application Entrypoint
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Live API Contracts & Parameter Specifications

### 3.1. Autentikasi
- **`POST /api/login`**:
  - Body: `{ email, password }` (JSON).
  - Response: `{ access_token, token_type, user: { id, name, email, role_access_user } }`.
- **`GET /api/user`**:
  - Mengambil data session user yang sedang login via Bearer Token.

### 3.2. Tabungan & SPP (`tabunganService.ts`)
- **`GET /api/staff/save-money/init`**:
  - Response: `{ users: StudentUser[], class_buttons: ClassButton[], riwayat_per_siswa: Record<string, SaveMoneyTransaction[]> }`.
- **`POST /api/staff/save-money/store`**:
  - Content-Type: `multipart/form-data` (`FormData`).
  - Fields:
    - `user_id` (number/string): ID santri tujuan.
    - `sirkulasi` (number): Nominal transaksi.
    - `kategori` (string): `'1'` untuk Menabung (+), `'0'` untuk Mengambil (-).
    - `tag` (string): `'uang_saku'` atau `'spp'`.
    - `ket_money` (string): Keterangan transaksi.
    - `invoice_money` (File/null, opsional): Bukti transfer.

### 3.3. Belanja Santri (`belanjaService.ts`)
- **`GET /api/staff/belanja-santri/init`**:
  - Mengambil data list santri, kelas, dan riwayat transaksi belanja kasir.
- **`POST /api/staff/belanja-santri/store`**:
  - Content-Type: `multipart/form-data` (`FormData`).
  - Fields: `user_id`, `sirkulasi`, `ket_belanja`.

### 3.4. WhatsApp Notification (`whatsappService.ts`)
- **`POST /api/staff/whatsapp/send`**:
  - Content-Type: `application/json`.
  - Body:
    ```json
    {
      "phone": "081234567813",
      "message": "Isi pesan WhatsApp..."
    }
    ```
  - Nomor tujuan diambil dari key `phone` pada objek JSON user santri.
  - Normalisasi format nomor tujuan (`08xxx` / `628xxx` / `+62xxx`) ditangani otomatis oleh backend.

---

## 4. Logika Thang & Matriks SPP 12 Bulan

1. **Format Thang**: `{tahun_awal}_{semester}` (contoh `2025_1`, `2025_2`, `2026_1`, `2026_2`).
2. **Kalkulasi 12 Bulan SPP**:
   - Berbasis pada `baseYear` (tahun awal dari `thang`).
   - Juli s/d Desember (`baseYear`) ➔ Semester 1 (`${baseYear}_1`).
   - Januari s/d Juni (`baseYear + 1`) ➔ Semester 2 (`${baseYear}_2`).
3. **Kriteria Pelunasan (🟢 Lunas)**:
   - HANYA transaksi penarikan saldo tabungan bertag `spp` (`kategori: "0"`, `Mengambil (-)`) yang menandai tagihan bulan SPP sebagai Lunas.
   - Setoran tabungan (`kategori: "1"`) dicatat sebagai saldo simpanan santri dan belum melunasi tagihan SPP.

---

## 5. Security & Session Handling
- **Session Storage Token**: Bearer token disimpan pada `sessionStorage` / `localStorage` dengan key `portal_bendahara_session_token`.
- **Role Route Protection**: Pembatasan akses route menggunakan Protected Layout berdasarkan `role_access_user`.
- **Financial Safety**: Pengecekan saldo santri di sisi client sebelum membuka modal konfirmasi guna mencegah penarikan melebihi saldo (`saldo >= nominal`).
