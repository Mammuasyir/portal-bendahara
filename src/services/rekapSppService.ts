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

// Map nama bulan ke index tahun ajaran (1 = Juli ... 12 = Juni)
const MONTH_NAME_TO_ACADEMIC_INDEX: Record<string, number> = {
  juli: 1,
  jul: 1,
  agustus: 2,
  agu: 2,
  ags: 2,
  aug: 2,
  august: 2,
  september: 3,
  sep: 3,
  sept: 3,
  oktober: 4,
  okt: 4,
  oct: 4,
  october: 4,
  november: 5,
  nov: 5,
  desember: 6,
  des: 6,
  dec: 6,
  december: 6,
  januari: 7,
  jan: 7,
  january: 7,
  februari: 8,
  feb: 8,
  february: 8,
  maret: 9,
  mar: 9,
  march: 9,
  april: 10,
  apr: 10,
  mei: 11,
  may: 11,
  juni: 12,
  jun: 12,
  june: 12,
};

// Map bulan kalender Masehi (1..12) ke index tahun ajaran santri (Juli = 1 ... Juni = 12)
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

  // 2. Cek dari teks keterangan (misal: "2025/2026" atau "2026/2027")
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
 * dengan multi-strategy parsing dan dukungan pembayaran multi-bulan akumulatif
 */
function buildMonthlyBillsFromTransactions(
  baseYear: number,
  txList: SaveMoneyTransaction[]
): SPPMonthRecord[] {
  // Ambil HANYA transaksi penarikan/pemotongan saldo (kategori: 0 / Mengambil (-) / money_flag_id: 2) yang bertag SPP
  // dan sesuai dengan tahun ajaran yang dipilih (baseYear)
  const sppTransactions = (txList || []).filter((t) => {
    const tagLower = (t.tag || '').toLowerCase();
    const ketLower = (t.keterangan || '').toLowerCase();
    const isTagSPP = tagLower === 'spp' || tagLower === 'tag_spp';
    const isKetSPP = ketLower.includes('spp') || ketLower.includes('syahriah');

    if (!isTagSPP && !isKetSPP) return false;

    // Pastikan transaksi merupakan PENARIKAN / PEMOTONGAN SALDO (kategori: 0 / money_flag_id: 2 / Mengambil)
    const isWithdrawal =
      t.jenis_transaksi?.includes('Mengambil') ||
      t.jenis_transaksi?.includes('Tarik') ||
      t.jenis_transaksi?.includes('-') ||
      String(t.money_flag_id) === '2' ||
      ketLower.includes('penarikan') ||
      ketLower.includes('pemotongan') ||
      ketLower.includes('potong saldo');

    if (!isWithdrawal) return false;

    // Filter kecocokan Tahun Ajaran berdasarkan thang
    return isTransactionInAcademicYear(t, baseYear);
  });

  const now = new Date();
  const currentCalYear = now.getFullYear();
  const currentCalMonth = now.getMonth() + 1; // 1-12 (8 = Agustus)
  // Tahun awal ajaran saat ini: Juli–Desember -> currentCalYear, Jan–Juni -> currentCalYear - 1
  const currentAcademicBaseYear = currentCalMonth >= 7 ? currentCalYear : currentCalYear - 1;
  const currentAcademicMonthIdx = CALENDAR_MONTH_TO_ACADEMIC_INDEX[currentCalMonth] || 2;

  // Track status pembayaran per index bulan ajaran (1 = Juli, 2 = Agustus, dst.)
  const monthPaymentMap = new Map<
    number,
    { nominal: number; paidAt: string; paymentMethod: string; notes?: string }
  >();

  // Pass 1: Proses setiap transaksi penarikan SPP
  sppTransactions.forEach((tx) => {
    const amount = Number(tx.jumlah || DEFAULT_MONTHLY_SPP);
    // Hitung berapa bulan yang dicakup oleh nominal transaksi ini (misal: Rp8.000.000 = 2 bulan)
    const monthsCovered = Math.max(1, Math.round(amount / DEFAULT_MONTHLY_SPP));
    const perMonthNominal = Math.round(amount / monthsCovered);

    const ketLower = (tx.keterangan || '').toLowerCase();
    let explicitMonthIdx: number | null = null;

    // 1. Cek apakah ada nama bulan tertentu di keterangan
    for (const [mName, mIdx] of Object.entries(MONTH_NAME_TO_ACADEMIC_INDEX)) {
      if (ketLower.includes(mName)) {
        explicitMonthIdx = mIdx;
        break;
      }
    }

    // 2. Jika tidak ada di keterangan, cek dari tanggal transaksi
    if (!explicitMonthIdx && tx.tanggal_transaksi) {
      const isoMatch = tx.tanggal_transaksi.match(/\b\d{4}-(\d{2})-\d{2}\b/);
      const idMatch = tx.tanggal_transaksi.match(/\b\d{1,2}[\/\-](\d{1,2})[\/\-]\d{4}\b/);

      let calMonth: number | null = null;
      if (isoMatch) calMonth = parseInt(isoMatch[1], 10);
      else if (idMatch) calMonth = parseInt(idMatch[1], 10);

      if (calMonth && CALENDAR_MONTH_TO_ACADEMIC_INDEX[calMonth]) {
        explicitMonthIdx = CALENDAR_MONTH_TO_ACADEMIC_INDEX[calMonth];
      }
    }

    const paidAtStr = tx.tanggal_transaksi || `${now.toLocaleDateString('id-ID')} 10:00 WIB`;
    const isWithdrawal = String(tx.jenis_transaksi || '').includes('Mengambil') || String(tx.money_flag_id) === '2';
    const methodStr =
      tx.keterangan ||
      (isWithdrawal ? 'Pemotongan Saldo Tabungan (SPP)' : 'Setoran SPP Terintegrasi API');

    let allocatedCount = 0;

    // Alokasi ke bulan eksplisit jika belum lunas
    if (explicitMonthIdx && !monthPaymentMap.has(explicitMonthIdx)) {
      monthPaymentMap.set(explicitMonthIdx, {
        nominal: perMonthNominal,
        paidAt: paidAtStr,
        paymentMethod: methodStr,
        notes: tx.keterangan || undefined,
      });
      allocatedCount++;
    }

    // Jika transaksi mencakup lebih dari 1 bulan (misal: 2 bulan / Rp8.000.000) atau belum ada bulan eksplisit:
    // Alokasikan ke bulan-bulan tertunggak terdahulu yang belum lunas (dimulai dari Juli = index 1, Agustus = index 2, dst.)
    for (let idx = 1; idx <= 12 && allocatedCount < monthsCovered; idx++) {
      if (!monthPaymentMap.has(idx)) {
        monthPaymentMap.set(idx, {
          nominal: perMonthNominal,
          paidAt: paidAtStr,
          paymentMethod: methodStr,
          notes: tx.keterangan || undefined,
        });
        allocatedCount++;
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
    const ketMoneyStr = `Pembayaran SPP Bulan ${payload.month} ${student.academicYear} | ${payload.paymentMethod}${payload.notes ? ' | ' + payload.notes : ''}`;

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
          ket_money: ketMoneyStr,
        });
      } catch (apiErr) {
        console.warn('API store returned notice (melanjutkan update cache UI):', apiErr);
      }
    }

    // 2. Hitung jumlah bulan yang dicakup oleh nominal pembayaran ini
    const monthsCovered = Math.max(1, Math.round(payload.nominal / DEFAULT_MONTHLY_SPP));
    const perMonthNominal = Math.round(payload.nominal / monthsCovered);

    // Update bulan yang dipilih
    student.monthlyBills[billIndex] = {
      ...student.monthlyBills[billIndex],
      nominal: perMonthNominal,
      status: 'lunas',
      paidAt: formattedPaidAt,
      paymentMethod: payload.paymentMethod || 'Transfer Bank BSI VA',
      transactionRef: `SPP-${now.getFullYear()}-${payload.month.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: payload.notes,
    };

    // Jika nominal mencakup lebih dari 1 bulan (misal 2 bulan = 8jt), lunasi juga bulan-bulan tertunggak lainnya
    let extraAllocated = 1;
    for (let i = 0; i < student.monthlyBills.length && extraAllocated < monthsCovered; i++) {
      if (student.monthlyBills[i].status === 'menunggak' && i !== billIndex) {
        student.monthlyBills[i] = {
          ...student.monthlyBills[i],
          nominal: perMonthNominal,
          status: 'lunas',
          paidAt: formattedPaidAt,
          paymentMethod: payload.paymentMethod || 'Transfer Bank BSI VA',
          transactionRef: `SPP-${now.getFullYear()}-${student.monthlyBills[i].month.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          notes: `Pelunasan akumulatif multi-bulan (${payload.notes || 'SPP'})`,
        };
        extraAllocated++;
      }
    }

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
