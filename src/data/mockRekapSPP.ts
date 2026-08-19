import { MonthName, StudentSPPRecord, SPPMonthRecord } from '../types/rekapSpp';

export const ACADEMIC_MONTHS: { name: MonthName; index: number; yearOffset: number }[] = [
  { name: 'Juli', index: 1, yearOffset: 0 },
  { name: 'Agustus', index: 2, yearOffset: 0 },
  { name: 'September', index: 3, yearOffset: 0 },
  { name: 'Oktober', index: 4, yearOffset: 0 },
  { name: 'November', index: 5, yearOffset: 0 },
  { name: 'Desember', index: 6, yearOffset: 0 },
  { name: 'Januari', index: 7, yearOffset: 1 },
  { name: 'Februari', index: 8, yearOffset: 1 },
  { name: 'Maret', index: 9, yearOffset: 1 },
  { name: 'April', index: 10, yearOffset: 1 },
  { name: 'Mei', index: 11, yearOffset: 1 },
  { name: 'Juni', index: 12, yearOffset: 1 },
];

export const DEFAULT_MONTHLY_SPP = 4000000; // Rp4.000.000

function generateMonthlyBills(
  baseYear: number,
  paidCount: number,
  arrearsCount: number,
  customNominal = DEFAULT_MONTHLY_SPP
): SPPMonthRecord[] {
  return ACADEMIC_MONTHS.map((m, idx) => {
    const year = baseYear + m.yearOffset;
    if (idx < paidCount) {
      return {
        month: m.name,
        monthIndex: m.index,
        year,
        nominal: customNominal,
        status: 'lunas',
        paidAt: `0${Math.floor(1 + Math.random() * 8)}/${String((idx % 12) + 7 > 12 ? (idx % 12) - 5 : (idx % 12) + 7).padStart(2, '0')}/${year} 09:30 WIB`,
        paymentMethod: idx % 2 === 0 ? 'BSI Virtual Account' : 'Bank Mandiri VA',
        transactionRef: `SPP-${year}-${m.name.slice(0, 3).toUpperCase()}-${1000 + idx * 37}`,
      };
    } else if (idx < paidCount + arrearsCount) {
      return {
        month: m.name,
        monthIndex: m.index,
        year,
        nominal: customNominal,
        status: 'menunggak',
        notes: 'Tagihan telah lewat jatuh tempo tanggal 10',
      };
    } else {
      return {
        month: m.name,
        monthIndex: m.index,
        year,
        nominal: customNominal,
        status: 'belum_jatuh_tempo',
      };
    }
  });
}

function calculateSummary(bills: SPPMonthRecord[]) {
  const totalTarget = bills.reduce((sum, b) => sum + b.nominal, 0);
  const totalPaid = bills.filter((b) => b.status === 'lunas').reduce((sum, b) => sum + b.nominal, 0);
  const totalArrears = bills.filter((b) => b.status === 'menunggak').reduce((sum, b) => sum + b.nominal, 0);
  const unpaidMonthsCount = bills.filter((b) => b.status === 'menunggak').length;

  let complianceStatus: 'lancar' | 'menunggak' | 'lunas_penuh' = 'lancar';
  if (unpaidMonthsCount > 0) {
    complianceStatus = 'menunggak';
  } else if (bills.every((b) => b.status === 'lunas')) {
    complianceStatus = 'lunas_penuh';
  }

  return { totalTarget, totalPaid, totalArrears, unpaidMonthsCount, complianceStatus };
}

// ─── Dataset Santri 12 Bulan Tahun Ajaran 2026/2027 ────────────────────────────
export const MOCK_STUDENTS_SPP_2026: StudentSPPRecord[] = [
  // Kelas 7A (SMP)
  {
    id: 1,
    studentId: 'std-7a-01',
    nisn: '0089201001',
    name: 'Abdullah Azzam Al-Fatih',
    jenjang: 'SMP',
    className: '7A',
    dormitory: 'Asrama Ibnu Khaldun',
    parentName: 'H. Bambang Sulistyo',
    parentPhone: '0812-3456-7001',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 2, 0), // Juli & Agustus Lunas, Lancar
    ...calculateSummary(generateMonthlyBills(2026, 2, 0)),
  },
  {
    id: 2,
    studentId: 'std-7a-02',
    nisn: '0089201002',
    name: 'Bilal Hafizh Pratama',
    jenjang: 'SMP',
    className: '7A',
    dormitory: 'Asrama Ibnu Khaldun',
    parentName: 'dr. Hendra Kusuma',
    parentPhone: '0812-3456-7002',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 1, 1), // Juli Lunas, Agustus Menunggak
    ...calculateSummary(generateMonthlyBills(2026, 1, 1)),
  },
  {
    id: 3,
    studentId: 'std-7a-03',
    nisn: '0089201003',
    name: 'Daffa Rizky Ramadhan',
    jenjang: 'SMP',
    className: '7A',
    dormitory: 'Asrama Ibnu Khaldun',
    parentName: 'Ir. Agus Wijaya',
    parentPhone: '0812-3456-7003',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 2, 0),
    ...calculateSummary(generateMonthlyBills(2026, 2, 0)),
  },

  // Kelas 7B (SMP)
  {
    id: 4,
    studentId: 'std-7b-01',
    nisn: '0089201004',
    name: 'Farhan Maulana Hakim',
    jenjang: 'SMP',
    className: '7B',
    dormitory: 'Asrama Al-Farabi',
    parentName: 'H. Sudirman, S.E.',
    parentPhone: '0813-8877-6601',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 0, 2), // Juli & Agustus Menunggak
    ...calculateSummary(generateMonthlyBills(2026, 0, 2)),
  },
  {
    id: 5,
    studentId: 'std-7b-02',
    nisn: '0089201005',
    name: 'Gibran Arkan Athallah',
    jenjang: 'SMP',
    className: '7B',
    dormitory: 'Asrama Al-Farabi',
    parentName: 'Ahmad Fauzan',
    parentPhone: '0813-8877-6602',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 2, 0),
    ...calculateSummary(generateMonthlyBills(2026, 2, 0)),
  },

  // Kelas 8A (SMP)
  {
    id: 6,
    studentId: 'std-8a-01',
    nisn: '0078201010',
    name: 'Hamzah Umar Zaidan',
    jenjang: 'SMP',
    className: '8A',
    dormitory: 'Asrama Salman Al-Farisi',
    parentName: 'Dr. M. Syafei, M.Ag.',
    parentPhone: '0811-9988-1101',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 2, 0),
    ...calculateSummary(generateMonthlyBills(2026, 2, 0)),
  },
  {
    id: 7,
    studentId: 'std-8a-02',
    nisn: '0078201011',
    name: 'Ihsan Kamil Robbani',
    jenjang: 'SMP',
    className: '8A',
    dormitory: 'Asrama Salman Al-Farisi',
    parentName: 'Wawan Gunawan',
    parentPhone: '0811-9988-1102',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 1, 1),
    ...calculateSummary(generateMonthlyBills(2026, 1, 1)),
  },

  // Kelas 9A (SMP)
  {
    id: 8,
    studentId: 'std-9a-01',
    nisn: '0067201020',
    name: 'Khalid Basalamah Rasyid',
    jenjang: 'SMP',
    className: '9A',
    dormitory: 'Asrama Abu Bakar',
    parentName: 'H. Anwar Ibrahim',
    parentPhone: '0852-3344-5501',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 2, 0),
    ...calculateSummary(generateMonthlyBills(2026, 2, 0)),
  },
  {
    id: 9,
    studentId: 'std-9a-02',
    nisn: '0067201021',
    name: 'Luqman Nurhakim',
    jenjang: 'SMP',
    className: '9A',
    dormitory: 'Asrama Abu Bakar',
    parentName: 'Suryanto, S.Pd.',
    parentPhone: '0852-3344-5502',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 2, 0),
    ...calculateSummary(generateMonthlyBills(2026, 2, 0)),
  },
  {
    id: 17,
    studentId: 'std-9a-03',
    nisn: '0067201022',
    name: 'Ahmad Fauzi',
    jenjang: 'SMP',
    className: '9A',
    dormitory: 'Asrama Abu Bakar',
    parentName: 'H. Syarifuddin',
    parentPhone: '0852-3344-5503',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 0, 2), // Default belum bayar 2 bulan (Juli & Agustus)
    ...calculateSummary(generateMonthlyBills(2026, 0, 2)),
  },

  // Kelas 10-RPL (SMA / SMK)
  {
    id: 10,
    studentId: 'std-10rpl-01',
    nisn: '0056201030',
    name: 'Muhammad Rayhan Firdaus',
    jenjang: 'SMK',
    className: '10-RPL',
    dormitory: 'Asrama Ibnu Sina',
    parentName: 'H. Dedi Supriyadi',
    parentPhone: '0811-9876-5432',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 0, 2), // Menunggak 2 bulan (Juli & Agustus)
    ...calculateSummary(generateMonthlyBills(2026, 0, 2)),
  },
  {
    id: 11,
    studentId: 'std-10rpl-02',
    nisn: '0056201031',
    name: 'Naufal Hilmy Zaki',
    jenjang: 'SMK',
    className: '10-RPL',
    dormitory: 'Asrama Ibnu Sina',
    parentName: 'Taufik Hidayat',
    parentPhone: '0811-9876-5433',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 2, 0),
    ...calculateSummary(generateMonthlyBills(2026, 2, 0)),
  },

  // Kelas 11-RPL (SMA / SMK)
  {
    id: 12,
    studentId: 'std-11rpl-01',
    nisn: '0045201040',
    name: 'Osman Zulkarnain',
    jenjang: 'SMK',
    className: '11-RPL',
    dormitory: 'Asrama Thariq Bin Ziyad',
    parentName: 'Drs. H. Mulyadi, M.Pd.',
    parentPhone: '0812-3456-7890',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 2, 0),
    ...calculateSummary(generateMonthlyBills(2026, 2, 0)),
  },
  {
    id: 13,
    studentId: 'std-11rpl-02',
    nisn: '0045201041',
    name: 'Pasha Adipati Arya',
    jenjang: 'SMK',
    className: '11-RPL',
    dormitory: 'Asrama Thariq Bin Ziyad',
    parentName: 'Kurniawan Santoso',
    parentPhone: '0812-3456-7891',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 1, 1),
    ...calculateSummary(generateMonthlyBills(2026, 1, 1)),
  },

  // Kelas 12-RPL (SMA / SMK)
  {
    id: 14,
    studentId: 'std-12rpl-01',
    nisn: '0034201050',
    name: 'Ahmad Fauzi As-Shiddiq',
    jenjang: 'SMK',
    className: '12-RPL',
    dormitory: 'Asrama Ibnu Sina',
    parentName: 'Drs. H. Mulyadi, M.Pd.',
    parentPhone: '0812-3456-7890',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 1, 1), // Juli Lunas, Agustus Menunggak
    ...calculateSummary(generateMonthlyBills(2026, 1, 1)),
  },
  {
    id: 15,
    studentId: 'std-12rpl-02',
    nisn: '0034201051',
    name: 'Rafi Akbar Maulana',
    jenjang: 'SMK',
    className: '12-RPL',
    dormitory: 'Asrama Ibnu Sina',
    parentName: 'H. Ridwan Syarif',
    parentPhone: '0812-3456-7892',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 2, 0),
    ...calculateSummary(generateMonthlyBills(2026, 2, 0)),
  },
  {
    id: 16,
    studentId: 'std-12rpl-03',
    nisn: '0034201052',
    name: 'Salman Al-Banjari',
    jenjang: 'SMK',
    className: '12-RPL',
    dormitory: 'Asrama Ibnu Sina',
    parentName: 'Yusuf Mansur, M.Si.',
    parentPhone: '0812-3456-7893',
    academicYear: '2026/2027',
    monthlyBills: generateMonthlyBills(2026, 12, 0), // Lunas 1 Tahun Penuh (Prestasi / Bayar Lunas Awal)
    ...calculateSummary(generateMonthlyBills(2026, 12, 0)),
  },
];
