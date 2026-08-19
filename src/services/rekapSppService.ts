import {
  StudentSPPRecord,
  RekapSPPStats,
  MonthName,
  SPPMonthRecord,
} from '../types/rekapSpp';
import {
  MOCK_STUDENTS_SPP_2026,
  ACADEMIC_MONTHS,
  DEFAULT_MONTHLY_SPP,
} from '../data/mockRekapSPP';
import { tabunganService } from './tabunganService';
import { SaveMoneyTransaction } from '../types/backend';
import {
  normalizeClassButtons,
  resolveStudentClassLabel,
  NormalizedClassButton,
} from '../utils/classHelper';

// In-memory cache for fast responsive UI & offline fallback
let cachedStudents: StudentSPPRecord[] = JSON.parse(JSON.stringify(MOCK_STUDENTS_SPP_2026));
let cachedClassButtons: NormalizedClassButton[] = [];

// Map index bulan kalender masehi (1=Jan .. 12=Des) ke index tahun ajaran (1=Juli .. 12=Juni)
const CALENDAR_MONTH_TO_ACADEMIC_INDEX: Record<number, number> = {
  7: 1, // Juli
  8: 2, // Agustus
  9: 3, // September
  10: 4, // Oktober
  11: 5, // November
  12: 6, // Desember
  1: 7, // Januari
  2: 8, // Februari
  3: 9, // Maret
  4: 10, // April
  5: 11, // Mei
  6: 12, // Juni
};

// Map nama bulan SPP ke nomor bulan kalender (01..12) & year offset
export const MONTH_TO_CALENDAR_NUMBER: Record<MonthName, { monthNum: string; yearOffset: number }> = {
  Juli: { monthNum: '07', yearOffset: 0 },
  Agustus: { monthNum: '08', yearOffset: 0 },
  September: { monthNum: '09', yearOffset: 0 },
  Oktober: { monthNum: '10', yearOffset: 0 },
  November: { monthNum: '11', yearOffset: 0 },
  Desember: { monthNum: '12', yearOffset: 0 },
  Januari: { monthNum: '01', yearOffset: 1 },
  Februari: { monthNum: '02', yearOffset: 1 },
  Maret: { monthNum: '03', yearOffset: 1 },
  April: { monthNum: '04', yearOffset: 1 },
  Mei: { monthNum: '05', yearOffset: 1 },
  Juni: { monthNum: '06', yearOffset: 1 },
};

/**
 * Helper: Mengenerate format ket_money standar Backend (YYYY-MM)
 * Contoh: Juli 2025/2026 -> "2025-07", Januari 2025/2026 -> "2026-01"
 */
export function formatKetMoneySPP(month: MonthName, baseYear: number): string {
  const info = MONTH_TO_CALENDAR_NUMBER[month] || { monthNum: '07', yearOffset: 0 };
  const calYear = baseYear + info.yearOffset;
  return `${calYear}-${info.monthNum}`;
}

/**
 * Helper: Mengecek apakah transaksi SPP masuk ke cakupan Tahun Ajaran (baseYear)
 * Thang format: {tahun_awal}_{semester} (misal 2025_1, 2025_2 -> baseYear 2025)
 */
function isTransactionInAcademicYear(tx: SaveMoneyTransaction, baseYear: number): boolean {
  // 1. Cek dari field thang backend (contoh: "2025_1", "2025_2")
  if (tx.thang) {
    const thangYear = parseInt(tx.thang.split('_')[0], 10);
    if (!isNaN(thangYear)) {
      return thangYear === baseYear;
    }
  }

  // 2. Cek dari teks keterangan (misal: "2025-07" atau "2025/2026" atau "2026/2027")
  const ketLower = (tx.keterangan || '').toLowerCase();
  if (ketLower.includes(`${baseYear}/${baseYear + 1}`)) return true;

  // 3. Cek dari tanggal_transaksi (Juli baseYear s/d Juni baseYear + 1)
  if (tx.tanggal_transaksi) {
    const isoMatch = tx.tanggal_transaksi.match(/\b(\d{4})-(\d{2})-\d{2}\b/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      if (year === baseYear && month >= 7) return true;
      if (year === baseYear + 1 && month <= 6) return true;
    }
  }

  return true;
}

/**
 * Helper: Memetakan transaksi riwayat santri dari backend API menjadi 12 bulan SPP
 * Mengikuti spesifikasi Backend: 1 transaksi = 1 bulan spesifik sesuai ket_money (format: YYYY-MM)
 */
function buildMonthlyBillsFromTransactions(
  baseYear: number,
  txList: SaveMoneyTransaction[]
): SPPMonthRecord[] {
  // Ambil transaksi penarikan/pemotongan saldo yang bertag SPP dan sesuai Tahun Ajaran
  const sppTransactions = (txList || []).filter((t) => {
    const tagLower = (t.tag || '').toLowerCase();
    const ketLower = (t.keterangan || '').toLowerCase();
    const isTagSPP = tagLower === 'spp' || tagLower === 'tag_spp';
    const isKetSPP = ketLower.includes('spp') || ketLower.includes('syahriah') || /\b20\d{2}-(0[1-9]|1[0-2])\b/.test(ketLower);

    if (!isTagSPP && !isKetSPP) return false;

    const isWithdrawal =
      t.jenis_transaksi?.includes('Mengambil') ||
      t.jenis_transaksi?.includes('Tarik') ||
      t.jenis_transaksi?.includes('-') ||
      String(t.money_flag_id) === '2' ||
      ketLower.includes('penarikan') ||
      ketLower.includes('pemotongan') ||
      ketLower.includes('potong saldo');

    if (!isWithdrawal) return false;

    return isTransactionInAcademicYear(t, baseYear);
  });

  const now = new Date();
  const currentCalYear = now.getFullYear();
  const currentCalMonth = now.getMonth() + 1; // 1-12
  const currentAcademicBaseYear = currentCalMonth >= 7 ? currentCalYear : currentCalYear - 1;
  const currentAcademicMonthIdx = CALENDAR_MONTH_TO_ACADEMIC_INDEX[currentCalMonth] || 2;

  // Track status pembayaran per index bulan ajaran (1 = Juli, 2 = Agustus, dst.)
  const monthPaymentMap = new Map<
    number,
    { nominal: number; paidAt: string; paymentMethod: string; notes?: string }
  >();

  // Pass 1: Proses setiap transaksi penarikan SPP
  // Sinkron dengan Backend: 1 transaksi mencatat 1 bulan spesifik sesuai ket_money (format: YYYY-MM)
  sppTransactions.forEach((tx) => {
    const amount = Number(tx.jumlah || DEFAULT_MONTHLY_SPP);
    const paidAtStr = tx.tanggal_transaksi || `${now.toLocaleDateString('id-ID')} 10:00 WIB`;
    const isWithdrawal = String(tx.jenis_transaksi || '').includes('Mengambil') || String(tx.money_flag_id) === '2';
    const methodStr =
      tx.keterangan ||
      (isWithdrawal ? 'Pemotongan Saldo Tabungan (SPP)' : 'Setoran SPP Terintegrasi API');

    const ketText = (tx.keterangan || '').trim();
    let targetAcademicIdx: number | null = null;

    // 1. Deteksi format standar BE (YYYY-MM) dari ket_money / keterangan (contoh: "2025-07", "2025-08", "2026-01")
    const yyyyMmMatch = ketText.match(/\b(20\d{2})-(0[1-9]|1[0-2])\b/);
    if (yyyyMmMatch) {
      const year = parseInt(yyyyMmMatch[1], 10);
      const calMonth = parseInt(yyyyMmMatch[2], 10);
      const expectedOffset = calMonth >= 7 ? 0 : 1;
      if (year === baseYear + expectedOffset) {
        targetAcademicIdx = CALENDAR_MONTH_TO_ACADEMIC_INDEX[calMonth] || null;
      }
    }

    // 2. Alokasikan 1 transaksi = 1 bulan spesifik yang dituju
    if (targetAcademicIdx && !monthPaymentMap.has(targetAcademicIdx)) {
      monthPaymentMap.set(targetAcademicIdx, {
        nominal: amount,
        paidAt: paidAtStr,
        paymentMethod: methodStr,
        notes: tx.keterangan || undefined,
      });
    } else {
      // Fallback: alokasikan berurutan ke bulan pertama yang belum lunas
      for (let idx = 1; idx <= 12; idx++) {
        if (!monthPaymentMap.has(idx)) {
          monthPaymentMap.set(idx, {
            nominal: amount,
            paidAt: paidAtStr,
            paymentMethod: methodStr,
            notes: tx.keterangan || undefined,
          });
          break;
        }
      }
    }
  });

  // Buat 12 Monthly Bills
  return ACADEMIC_MONTHS.map((m) => {
    const year = baseYear + m.yearOffset;
    const academicMonthIdx = m.index; // 1 to 12
    const payment = monthPaymentMap.get(academicMonthIdx);

    if (payment) {
      return {
        month: m.name,
        monthIndex: m.index,
        year,
        nominal: payment.nominal,
        status: 'lunas',
        paidAt: payment.paidAt,
        paymentMethod: payment.paymentMethod,
        transactionRef: `SPP-${year}-${m.name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: payment.notes,
      };
    }

    // Jika belum lunas, tentukan apakah sudah jatuh tempo
    let isPastMonth = false;
    if (baseYear < currentAcademicBaseYear) {
      isPastMonth = true; // Seluruh bulan di tahun ajaran lampau sudah lewat jatuh tempo
    } else if (baseYear === currentAcademicBaseYear) {
      isPastMonth = academicMonthIdx <= currentAcademicMonthIdx; // Tahun berjalan
    } else {
      isPastMonth = false; // Tahun ajaran mendatang
    }

    if (isPastMonth) {
      return {
        month: m.name,
        monthIndex: m.index,
        year,
        nominal: DEFAULT_MONTHLY_SPP,
        status: 'menunggak',
        notes: 'Tagihan telah lewat jatuh tempo tanggal 10',
      };
    } else {
      return {
        month: m.name,
        monthIndex: m.index,
        year,
        nominal: DEFAULT_MONTHLY_SPP,
        status: 'belum_jatuh_tempo',
      };
    }
  });
}

function findStudentTransactions(
  u: any,
  riwayatMap: Record<string, SaveMoneyTransaction[]>
): SaveMoneyTransaction[] {
  if (!riwayatMap) return [];

  // 1. Cek direct key matching berdasarkan ID numerik / string
  const uIdStr = String(u.id ?? u.user_id ?? '');
  if (uIdStr && riwayatMap[uIdStr] && riwayatMap[uIdStr].length > 0) {
    return riwayatMap[uIdStr];
  }

  // 2. Cek direct key matching berdasarkan NISN
  const uNisn = String(u.nisn || u.nis || '').trim();
  if (uNisn && riwayatMap[uNisn] && riwayatMap[uNisn].length > 0) {
    return riwayatMap[uNisn];
  }

  // 3. Scan seluruh riwayat transaksi untuk mencocokkan user_id atau nama siswa
  const targetId = Number(u.id ?? u.user_id ?? 0);
  const targetName = String(u.name || u.nama || '').trim().toLowerCase();

  for (const [, list] of Object.entries(riwayatMap)) {
    if (Array.isArray(list) && list.length > 0) {
      const match = list.some((t) => {
        const matchId = targetId > 0 && Number(t.user_id) === targetId;
        const matchNisn = uNisn && String(t.user_id) === uNisn;
        const matchName =
          targetName &&
          t.nama_siswa &&
          t.nama_siswa.trim().toLowerCase() === targetName;
        return matchId || matchNisn || matchName;
      });
      if (match) return list;
    }
  }

  return [];
}

function calculateSavingsBalanceFromTransactions(
  txList: SaveMoneyTransaction[],
  directBalance?: number
): number {
  if (typeof directBalance === 'number' && directBalance >= 0) {
    return directBalance;
  }
  if (!txList || txList.length === 0) return 0;

  // 1. Cek saldo_sesudah dari mutasi terakhir
  const lastTx = txList[txList.length - 1];
  if (typeof lastTx.saldo_sesudah === 'number' && lastTx.saldo_sesudah > 0) {
    return lastTx.saldo_sesudah;
  }

  // 2. Hitung akumulasi masuk minus keluar
  let balance = 0;
  txList.forEach((t) => {
    const isOut =
      t.jenis_transaksi?.includes('Mengambil') ||
      t.jenis_transaksi?.includes('Tarik') ||
      t.jenis_transaksi?.includes('-') ||
      String(t.money_flag_id) === '2' ||
      (t.keterangan && t.keterangan.toLowerCase().includes('penarikan')) ||
      (t.keterangan && t.keterangan.toLowerCase().includes('pemotongan')) ||
      (t.keterangan && t.keterangan.toLowerCase().includes('potong saldo'));

    const amt = Math.abs(Number(t.jumlah || 0));
    if (isOut) {
      balance -= amt;
    } else {
      balance += amt;
    }
  });

  return Math.max(0, balance);
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

export const rekapSppService = {
  /**
   * Mengambil daftar santri dengan data rekap SPP 12 bulan
   * Terintegrasi langsung dengan API /api/staff/save-money/init
   */
  async getRekapList(params?: {
    academicYear?: string;
    jenjang?: string;
    className?: string;
    statusFilter?: 'ALL' | 'lancar' | 'menunggak' | 'lunas_penuh';
    search?: string;
  }): Promise<StudentSPPRecord[]> {
    const selectedThang = params?.academicYear || '2026/2027';
    const baseYear = parseInt(selectedThang.split('/')[0], 10) || 2026;

    try {
      // Panggil API live /api/staff/save-money/init
      const initRes = await tabunganService.init();
      if (initRes && initRes.users && initRes.users.length > 0) {
        cachedClassButtons = normalizeClassButtons(initRes.class_buttons);

        cachedStudents = initRes.users.map((u: any) => {
          const rawClassId = u.class_id ?? u.id_kelas ?? u.class;
          const classLabel = resolveStudentClassLabel(u, cachedClassButtons);

          const jenjangStr: 'SMP' | 'SMA' | 'SMK' =
            classLabel.includes('7') || classLabel.includes('8') || classLabel.includes('9')
              ? 'SMP'
              : 'SMK';

          const txList = findStudentTransactions(u, initRes.riwayat_per_siswa || {});
          const bills = buildMonthlyBillsFromTransactions(baseYear, txList);
          const summary = calculateSummary(bills);

          const rawDirectBalance = u.balance ?? u.saldo ?? u.total_saldo ?? u.saldo_akhir;
          const directBalance = rawDirectBalance !== undefined && rawDirectBalance !== null ? Number(rawDirectBalance) : undefined;
          const currentSavings = calculateSavingsBalanceFromTransactions(txList, directBalance);

          return {
            id: u.id,
            studentId: `std-${u.id}`,
            nisn: u.nisn || `008920${String(u.id).padStart(4, '0')}`,
            name: u.name,
            jenjang: jenjangStr,
            classId: rawClassId !== undefined && rawClassId !== null ? Number(rawClassId) : undefined,
            className: classLabel,
            dormitory: `Asrama Santri (Kelas ${classLabel})`,
            parentName: `Wali dari ${u.name}`,
            parentPhone: u.phone || '081234567813',
            academicYear: selectedThang,
            monthlyBills: bills,
            savingsBalance: currentSavings,
            ...summary,
          };
        });
      }
    } catch (err) {
      console.info('Menggunakan data cache lokal untuk rekap SPP:', err);
    }

    // Terapkan filter
    return cachedStudents.filter((s) => {
      if (params?.academicYear && params.academicYear !== 'ALL' && s.academicYear !== params.academicYear) {
        return false;
      }
      if (params?.jenjang && params.jenjang !== 'ALL' && s.jenjang !== params.jenjang) {
        return false;
      }
      if (params?.className && params.className !== 'ALL') {
        const filterVal = String(params.className).toLowerCase().replace(/^kelas\s*/, '').trim();
        const studentLabel = s.className.toLowerCase().replace(/^kelas\s*/, '').trim();
        const studentClassId = String(s.classId ?? '').toLowerCase().trim();

        const matchLabel = studentLabel === filterVal;
        const matchId = studentClassId === filterVal;
        if (!matchLabel && !matchId) return false;
      }
      if (params?.statusFilter && params.statusFilter !== 'ALL' && s.complianceStatus !== params.statusFilter) {
        return false;
      }
      if (params?.search && params.search.trim()) {
        const query = params.search.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(query);
        const matchNisn = s.nisn.toLowerCase().includes(query);
        const matchParent = s.parentName.toLowerCase().includes(query);
        if (!matchName && !matchNisn && !matchParent) return false;
      }
      return true;
    });
  },

  /**
   * Mengambil daftar tombol kelas dari API
   */
  async getClassButtons(): Promise<NormalizedClassButton[]> {
    if (cachedClassButtons.length > 0) return cachedClassButtons;
    try {
      const res = await tabunganService.init();
      cachedClassButtons = normalizeClassButtons(res.class_buttons);
      return cachedClassButtons;
    } catch {
      return normalizeClassButtons(null);
    }
  },

  /**
   * Menghitung statistik makro dan akumulasi arus kas masuk 12 bulan
   */
  async getRekapStats(params?: {
    academicYear?: string;
    jenjang?: string;
    className?: string;
  }): Promise<RekapSPPStats> {
    const list = await this.getRekapList(params);

    const totalStudents = list.length;
    const totalTargetAnnual = list.reduce((sum, s) => sum + s.totalTarget, 0);
    const totalRealized = list.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalArrears = list.reduce((sum, s) => sum + s.totalArrears, 0);

    const lancarCount = list.filter((s) => s.complianceStatus === 'lancar' || s.complianceStatus === 'lunas_penuh').length;
    const menunggakCount = list.filter((s) => s.complianceStatus === 'menunggak').length;
    const lunasPenuhCount = list.filter((s) => s.complianceStatus === 'lunas_penuh').length;

    const complianceRate = totalStudents > 0 ? Math.round((lancarCount / totalStudents) * 100) : 0;

    // Monthly inflows breakdown
    const monthlyInflows = ACADEMIC_MONTHS.map((m) => {
      let target = 0;
      let realized = 0;
      let arrears = 0;
      let lunasCount = 0;

      list.forEach((s) => {
        const bill = s.monthlyBills.find((b) => b.month === m.name);
        if (bill) {
          target += bill.nominal;
          if (bill.status === 'lunas') {
            realized += bill.nominal;
            lunasCount += 1;
          } else if (bill.status === 'menunggak') {
            arrears += bill.nominal;
          }
        }
      });

      return {
        month: m.name,
        monthIndex: m.index,
        target,
        realized,
        arrears,
        lunasCount,
      };
    });

    return {
      academicYear: params?.academicYear || '2026/2027',
      totalStudents,
      totalTargetAnnual,
      totalRealized,
      totalArrears,
      complianceRate,
      lancarCount,
      menunggakCount,
      lunasPenuhCount,
      monthlyInflows,
    };
  },

  /**
   * Catat / Sesuaikan Pembayaran SPP untuk bulan tertentu secara Real ke API Backend
   * Mengirim transaksi ke POST /api/staff/save-money/store dengan tag: "spp"
   */
  async recordPayment(payload: {
    studentId: string;
    month: MonthName;
    nominal: number; // nominal yang disesuaikan (default 4.000.000)
    paymentMethod: string;
    notes?: string;
    skipApiStore?: boolean;
    kategori?: '1' | '0';
  }): Promise<StudentSPPRecord> {
    const student = cachedStudents.find(
      (s) => s.studentId === payload.studentId || String(s.id) === payload.studentId || s.name.toLowerCase() === payload.studentId.toLowerCase()
    );
    if (!student) {
      throw new Error('Data santri tidak ditemukan.');
    }

    const billIndex = student.monthlyBills.findIndex((b) => b.month === payload.month);
    if (billIndex === -1) {
      throw new Error('Bulan tagihan tidak ditemukan.');
    }

    const now = new Date();
    const formattedPaidAt = `${now.toLocaleDateString('id-ID')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;
    const baseYear = parseInt(student.academicYear.split('/')[0], 10) || 2025;
    const ketMoneyFormatted = formatKetMoneySPP(payload.month, baseYear); // Format: "2025-07"
    const invoiceDesc = `Pembayaran SPP Bulan ${payload.month} ${student.academicYear} | ${payload.paymentMethod}${payload.notes ? ' | ' + payload.notes : ''}`;

    // 1. Eksekusi request API nyata ke backend /api/staff/save-money/store jika belum dieksekusi pemanggil
    if (!payload.skipApiStore) {
      const isDeduction =
        payload.kategori === '0' ||
        (payload.paymentMethod && (
          payload.paymentMethod.toLowerCase().includes('potong') ||
          payload.paymentMethod.toLowerCase().includes('saldo') ||
          payload.paymentMethod.toLowerCase().includes('tabungan')
        ));
      const targetKategori: '1' | '0' = isDeduction ? '0' : (payload.kategori || '1');

      try {
        await tabunganService.store({
          user_id: student.id,
          sirkulasi: payload.nominal,
          kategori: targetKategori,
          tag: 'spp',
          ket_money: ketMoneyFormatted,
          invoice_money: invoiceDesc,
        });
      } catch (apiErr) {
        console.warn('API store returned notice (melanjutkan update cache UI):', apiErr);
      }
    }

    // 2. Sinkron dengan BE: Update 1 bulan yang dipilih sesuai ket_money (format YYYY-MM)
    student.monthlyBills[billIndex] = {
      ...student.monthlyBills[billIndex],
      nominal: payload.nominal,
      status: 'lunas',
      paidAt: formattedPaidAt,
      paymentMethod: payload.paymentMethod || 'Potong Saldo Tabungan',
      transactionRef: `SPP-${now.getFullYear()}-${payload.month.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: payload.notes,
    };

    // Recalculate student totals
    const totalTarget = student.monthlyBills.reduce((sum, b) => sum + b.nominal, 0);
    const totalPaid = student.monthlyBills.filter((b) => b.status === 'lunas').reduce((sum, b) => sum + b.nominal, 0);
    const totalArrears = student.monthlyBills.filter((b) => b.status === 'menunggak').reduce((sum, b) => sum + b.nominal, 0);
    const unpaidMonthsCount = student.monthlyBills.filter((b) => b.status === 'menunggak').length;

    let complianceStatus: 'lancar' | 'menunggak' | 'lunas_penuh' = 'lancar';
    if (unpaidMonthsCount > 0) {
      complianceStatus = 'menunggak';
    } else if (student.monthlyBills.every((b) => b.status === 'lunas')) {
      complianceStatus = 'lunas_penuh';
    }

    student.totalTarget = totalTarget;
    student.totalPaid = totalPaid;
    student.totalArrears = totalArrears;
    student.unpaidMonthsCount = unpaidMonthsCount;
    student.complianceStatus = complianceStatus;

    return student;
  },

  /**
   * Reset mock data
   */
  resetState(): void {
    cachedStudents = JSON.parse(JSON.stringify(MOCK_STUDENTS_SPP_2026));
  },
};
