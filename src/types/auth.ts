export type UserRole = 'parent' | 'student' | 'admin' | 'canteen_staff';

export interface StudentProfile {
  id: string;
  nis: string;
  name: string;
  grade: string; // e.g. "XII-IPA 1"
  canteenBalance: number;
  unpaidSPPBillsCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  identifier: string; // e.g. "NIS: 202401089" atau "NIP: 19850315"
  phone: string;
  avatarUrl?: string;
  // Khusus Orang Tua: Daftar anak asrama yang terhubung
  children?: StudentProfile[];
  // Khusus Siswa: Profil spesifik siswa
  studentProfile?: StudentProfile;
}

export interface LoginCredentials {
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
