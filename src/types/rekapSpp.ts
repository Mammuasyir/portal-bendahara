export type MonthName =
  | 'Juli'
  | 'Agustus'
  | 'September'
  | 'Oktober'
  | 'November'
  | 'Desember'
  | 'Januari'
  | 'Februari'
  | 'Maret'
  | 'April'
  | 'Mei'
  | 'Juni';

export type SPPMonthStatus = 'lunas' | 'menunggak' | 'belum_jatuh_tempo';

export interface SPPMonthRecord {
  month: MonthName;
  monthIndex: number; // 1 to 12 (1 = Juli, 12 = Juni)
  year: number;
  nominal: number; // default Rp4.000.000, can be customized
  status: SPPMonthStatus;
  paidAt?: string;
  paymentMethod?: string;
  transactionRef?: string;
  notes?: string;
}

export interface StudentSPPRecord {
  id: number; // Numeric ID santri untuk API backend
  studentId: string;
  nisn: string;
  name: string;
  jenjang: 'SMP' | 'SMA' | 'SMK';
  classId?: number;
  className: string; // e.g. "7A", "8A", "9A", "X-RPL", "XI-RPL", "XII-RPL"
  dormitory: string; // e.g. "Asrama Ibnu Sina"
  parentName: string;
  parentPhone: string;
  academicYear: string; // e.g. "2026/2027"
  monthlyBills: SPPMonthRecord[];
  totalTarget: number;
  totalPaid: number;
  totalArrears: number; // Total tunggakan
  unpaidMonthsCount: number;
  complianceStatus: 'lancar' | 'menunggak' | 'lunas_penuh';
  savingsBalance?: number; // Saldo rekening tabungan santri berjalan
}

export interface RekapSPPStats {
  academicYear: string;
  totalStudents: number;
  totalTargetAnnual: number;
  totalRealized: number;
  totalArrears: number;
  complianceRate: number; // Percentage 0 - 100
  lancarCount: number;
  menunggakCount: number;
  lunasPenuhCount: number;
  monthlyInflows: {
    month: MonthName;
    monthIndex: number;
    target: number;
    realized: number;
    arrears: number;
    lunasCount: number;
  }[];
}
