# Phase 02: Autentikasi Multi-Role & Route Guarding

## 1. Objective
Mengimplementasikan modul autentikasi multi-role (Orang Tua, Admin/TU, Siswa), state session pengguna (`AuthContext`), halaman login terpisah, role switcher untuk keperluan demo/pengujian, dan sistem proteksi rute (`ProtectedRoute`).

---

## 2. Scope & Relevant Areas
- Type definitions autentikasi di `src/types/auth.ts`.
- Mock user fixtures di `src/data/mockUsers.ts` (Akun Orang Tua, Akun Siswa, Akun Admin/TU).
- Auth Service mock adapter di `src/services/authService.ts`.
- `AuthContext` & `useAuth` hook untuk manajemen state sesi pengguna.
- Halaman `LoginPage` yang terisolasi dari layout dashboard.
- Floating quick role switcher (opsional/demo-only) untuk beralih akun secara instan saat pengujian.
- Komponen `ProtectedRoute` untuk memastikan role isolation.

---

## 3. Reference Documents
- Kebutuhan & Personas: [`docs/prd.md`](file:///c:/Users/mammu/portal-bendahara/docs/prd.md) (FR-AUTH-01 s/d FR-AUTH-04)
- Aturan UI/UX Form: [`docs/uiguideline.md`](file:///c:/Users/mammu/portal-bendahara/docs/uiguideline.md)
- Arsitektur Security & Session: [`docs/implementation.md`](file:///c:/Users/mammu/portal-bendahara/docs/implementation.md)

---

## 4. Acceptance Criteria
- [x] User dapat login memilih role atau memasukkan credential mock (Orang Tua / Siswa / Admin).
- [x] Setelah login berhasil, user otomatis di-redirect ke halaman utama sesuai role masing-masing.
- [x] User yang belum terautentikasi otomatis di-redirect ke `/login` jika mencoba membuka rute berbayar.
- [x] Role Siswa yang mencoba mengakses rute `/admin` ditolak dengan tampilan *"Akses Tidak Diizinkan"*.
- [x] Fitur Logout membersihkan session dan mengembalikan pengguna ke halaman login.

---

## 5. Verification Steps
1. Uji alur login untuk masing-masing role: `admin@sekolah.sch.id`, `parent@sekolah.sch.id`, `siswa@sekolah.sch.id`.
2. Uji direct URL access ke rute terlindungi tanpa session aktif.
3. Uji role switching dan verifikasi data user yang tersimpan di state.

---

**Dependencies**: [Phase 01](file:///c:/Users/mammu/portal-bendahara/docs/phases/phase-01.md)  
**Status**: `COMPLETED`
