/**
 * Tipe Data Resmi Sesuai Kontrak Backend idn-keuangan
 * (Referensi: backend/API_DOCUMENTATION.md & Prisma Schema)
 */

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  role_access_user: number; // 0=santri, 1=guru, 2=staf, 3=lainnya, 4=admin, 10=walikelas, 11=walikelas aktif
  phone?: string;
  nisn?: string;
}

export interface StudentUser {
  id: number;
  name: string;
  nisn: string;
  email?: string;
  phone?: string;
  role_access_user?: number;
  class_id?: number;
  thang?: string;
}

export interface ClassButton {
  value: number;
  label: string;
}

// Belanja Models
export interface BelanjaTransaction {
  id: number;
  user_id: number;
  user_name: string;
  sirkulasi: number;
  tag: string | null;
  ket_money: string | null;
  invoice_money: string | null;
  created_at: string;
}

export interface BelanjaInitResponse {
  thang_session: string;
  users: StudentUser[];
  saldo_per_siswa: Record<string, number>;
  locked_tag: string | null;
}

export interface BelanjaStatsTag {
  total: number;
  count: number;
  avg: number;
}

export interface BelanjaStatsResponse {
  date_from: string;
  date_to: string;
  locked_tag: string | null;
  per_tag: Record<string, BelanjaStatsTag>;
  daily_trend: Array<{
    date: string;
    [tag: string]: string | number;
  }>;
  grand_total: number;
}

export interface CreateBelanjaPayload {
  user_id: number;
  sirkulasi: number;
  tag?: string;
  ket_money?: string;
  invoice_money?: File | null;
}

export interface UpdateBelanjaPayload {
  sirkulasi: number;
  ket_money?: string;
  invoice_money?: File | null;
}

// Tabungan (Save Money) Models
export interface SaveMoneyTransaction {
  user_id: number;
  nama_siswa: string;
  money_flag_id: number;
  jumlah: number;
  tag: string | null;
  keterangan: string | null;
  invoice: string | null;
  is_active: number | boolean;
  tanggal_transaksi: string;
  thang: string;
  jenis_transaksi: 'Menabung (+)' | 'Mengambil (-)' | string;
  saldo_sebelum: number;
  saldo_sesudah: number;
}

export interface SaveMoneyInitResponse {
  class_buttons: ClassButton[];
  users: StudentUser[];
  riwayat_per_siswa: Record<string, SaveMoneyTransaction[]>;
}

export interface CreateSaveMoneyPayload {
  user_id: number;
  sirkulasi: number;
  kategori: '1' | '0' | boolean; // true / "1" = menabung (+), false / "0" = mengambil (-)
  tag?: string;
  ket_money?: string;
  invoice_money?: string | File | null;
}
