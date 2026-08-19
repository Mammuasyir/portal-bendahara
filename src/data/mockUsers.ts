import { User } from '../types/auth';

export const MOCK_STUDENTS = [
  {
    id: 'std-001',
    nis: '202401089',
    name: 'Ahmad Fauzi',
    grade: 'XII-IPA 1 (Asrama Ibnu Sina)',
    canteenBalance: 175000,
    unpaidSPPBillsCount: 1,
  },
  {
    id: 'std-002',
    nis: '202401090',
    name: 'Fatimah Zahra',
    grade: 'X-IPS 2 (Asrama Aisyah)',
    canteenBalance: 240000,
    unpaidSPPBillsCount: 0,
  },
  {
    id: 'std-003',
    nis: '202401091',
    name: 'Muhammad Rayhan',
    grade: 'XI-IPA 2 (Asrama Al-Farabi)',
    canteenBalance: 85000,
    unpaidSPPBillsCount: 2,
  },
];

export const MOCK_USERS: User[] = [
  // 1. Akun Orang Tua
  {
    id: 'usr-parent-01',
    email: 'parent@sekolah.sch.id',
    name: 'Drs. H. Mulyadi, M.Pd.',
    role: 'parent',
    identifier: 'Wali: Ahmad Fauzi & Fatimah',
    phone: '0812-3456-7890',
    children: [MOCK_STUDENTS[0], MOCK_STUDENTS[1]],
  },
  // 2. Akun Siswa
  {
    id: 'usr-student-01',
    email: 'siswa@sekolah.sch.id',
    name: 'Ahmad Fauzi',
    role: 'student',
    identifier: 'NIS: 202401089',
    phone: '0813-9876-5432',
    studentProfile: MOCK_STUDENTS[0],
  },
  // 3. Akun Admin / Tata Usaha Keuangan
  {
    id: 'usr-admin-01',
    email: 'admin@sekolah.sch.id',
    name: 'Ustadzah Sarah, S.E.',
    role: 'admin',
    identifier: 'NIP: 198804122011012003',
    phone: '0811-2233-4455',
  },
  // 4. Akun Staff Kantin / Kasir Asrama (Sesuai Backend /api/staff/save-money)
  {
    id: 'usr-canteen-01',
    email: 'kantin@sekolah.sch.id',
    name: 'Pak Joko (Kasir Kantin)',
    role: 'canteen_staff',
    identifier: 'Petugas Loket & Kasir Kantin',
    phone: '0815-6789-0123',
  },
];
