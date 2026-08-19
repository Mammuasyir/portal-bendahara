import React, { useState, useEffect, useCallback } from 'react';
import { rekapSppService } from '../../services/rekapSppService';
import { tabunganService } from '../../services/tabunganService';
import { whatsappService } from '../../services/whatsappService';
import {
  StudentSPPRecord,
  RekapSPPStats,
  MonthName,
} from '../../types/rekapSpp';
import { SaveMoneyTransaction } from '../../types/backend';
import { ACADEMIC_MONTHS, DEFAULT_MONTHLY_SPP } from '../../data/mockRekapSPP';
import { formatRupiah } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ConfirmActionModal } from '../../components/common/ConfirmActionModal';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  UserCheck,
  RefreshCw,
  CreditCard,
} from 'lucide-react';

import { NormalizedClassButton } from '../../utils/classHelper';

const ACADEMIC_YEAR_OPTIONS = ['2026/2027', '2025/2026'];
const JENJANG_OPTIONS = ['ALL', 'SMP', 'SMK'];

export const RekapSPPPage: React.FC = () => {
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [selectedJenjang, setSelectedJenjang] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [classButtons, setClassButtons] = useState<NormalizedClassButton[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'lancar' | 'menunggak' | 'lunas_penuh'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [students, setStudents] = useState<StudentSPPRecord[]>([]);
  const [stats, setStats] = useState<RekapSPPStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal Detail & Payment State
  const [selectedStudent, setSelectedStudent] = useState<StudentSPPRecord | null>(null);
  const [paymentMonth, setPaymentMonth] = useState<MonthName>('Agustus');
  const [paymentNominal, setPaymentNominal] = useState<number>(DEFAULT_MONTHLY_SPP);
  const [paymentMethod, setPaymentMethod] = useState<string>('Potong Saldo Tabungan');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // WhatsApp Reminder Modal State
  const [reminderStudent, setReminderStudent] = useState<StudentSPPRecord | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, statsRes, classRes] = await Promise.all([
        rekapSppService.getRekapList({
          academicYear,
          jenjang: selectedJenjang,
          className: selectedClass,
          statusFilter,
          search: searchQuery,
        }),
        rekapSppService.getRekapStats({
          academicYear,
          jenjang: selectedJenjang,
          className: selectedClass,
        }),
        rekapSppService.getClassButtons(),
      ]);

      setStudents(listRes);
      setStats(statsRes);
      setClassButtons(classRes || []);
    } catch (err) {
      console.warn('Gagal memuat rekap SPP:', err);
    } finally {
      setIsLoading(false);
    }
  }, [academicYear, selectedJenjang, selectedClass, statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenPaymentForStudent = async (student: StudentSPPRecord, _month?: MonthName) => {
    setSelectedStudent(student);
    const firstUnpaidBill = student.monthlyBills.find((b) => b.status !== 'lunas');
    const firstUnpaid = firstUnpaidBill?.month || 'Juli';
    setPaymentMonth(firstUnpaid);
    setPaymentNominal(firstUnpaidBill?.nominal || DEFAULT_MONTHLY_SPP);
    setPaymentMethod('Potong Saldo Tabungan');
    setPaymentNotes('');
    setIsDetailModalOpen(true);

    // Ambil saldo real-time langsung dari tabunganService.init()
    try {
      const res = await tabunganService.init();
      if (res && res.riwayat_per_siswa) {
        const uId = String(student.id);
        const uNisn = String(student.nisn);
        let txList = res.riwayat_per_siswa[uId] || res.riwayat_per_siswa[uNisn] || [];

        if (txList.length === 0) {
          for (const [, list] of Object.entries(res.riwayat_per_siswa)) {
            if (
              Array.isArray(list) &&
              list.some(
                (t: SaveMoneyTransaction) =>
                  Number(t.user_id) === Number(student.id) ||
                  (student.name &&
                    t.nama_siswa?.toLowerCase() === student.name.toLowerCase())
              )
            ) {
              txList = list;
              break;
            }
          }
        }

        if (txList.length > 0) {
          let calculated = 0;
          txList.forEach((t: SaveMoneyTransaction) => {
            const isOut =
              t.jenis_transaksi?.includes('Mengambil') ||
              t.jenis_transaksi?.includes('Tarik') ||
              t.jenis_transaksi?.includes('-') ||
              String(t.money_flag_id) === '2' ||
              (t.keterangan && t.keterangan.toLowerCase().includes('penarikan')) ||
              (t.keterangan && t.keterangan.toLowerCase().includes('pemotongan')) ||
              (t.keterangan && t.keterangan.toLowerCase().includes('potong saldo'));
            const amt = Math.abs(Number(t.jumlah || 0));
            if (isOut) calculated -= amt;
            else calculated += amt;
          });

          const lastSesudah = txList[txList.length - 1].saldo_sesudah;
          const liveBal = typeof lastSesudah === 'number' && lastSesudah > 0 ? lastSesudah : Math.max(0, calculated);
          setSelectedStudent((prev) => (prev && prev.id === student.id ? { ...prev, savingsBalance: liveBal } : prev));
        }
      }
    } catch {
      // Tetap gunakan saldo dari rekap list jika offline
    }
  };

  const handlePreparePaymentConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (paymentNominal <= 0) {
      alert('Nominal pembayaran harus lebih dari Rp0.');
      return;
    }

    // Validasi urutan pembayaran (wajib melunasi bulan tertunggak terdahulu)
    const firstUnpaidBill = selectedStudent.monthlyBills.find((b) => b.status !== 'lunas');
    if (firstUnpaidBill && paymentMonth !== firstUnpaidBill.month) {
      const currentSelectedBill = selectedStudent.monthlyBills.find((b) => b.month === paymentMonth);
      if (currentSelectedBill && currentSelectedBill.monthIndex > firstUnpaidBill.monthIndex) {
        alert(
          `Pembayaran SPP harus dilakukan secara berurutan!\n\nSilakan selesaikan pembayaran SPP Bulan ${firstUnpaidBill.month} terlebih dahulu sebelum membayar bulan ${paymentMonth}.`
        );
        setPaymentMonth(firstUnpaidBill.month);
        setPaymentNominal(firstUnpaidBill.nominal || DEFAULT_MONTHLY_SPP);
        return;
      }
    }

    const isDeduction =
      paymentMethod.toLowerCase().includes('potong') ||
      paymentMethod.toLowerCase().includes('saldo') ||
      paymentMethod.toLowerCase().includes('tabungan');

    if (isDeduction && selectedStudent) {
      const curSavings = selectedStudent.savingsBalance ?? 0;
      if (curSavings < paymentNominal) {
        alert(
          `Saldo tabungan santri tidak mencukupi untuk pemotongan SPP!\n\nSaldo Saat Ini: ${formatRupiah(curSavings)}\nTagihan SPP: ${formatRupiah(paymentNominal)}\nKekurangan: ${formatRupiah(paymentNominal - curSavings)}`
        );
        return;
      }
    }
    setIsConfirmModalOpen(true);
  };

  const handleExecutePayment = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const isDeduction =
        paymentMethod.toLowerCase().includes('potong') ||
        paymentMethod.toLowerCase().includes('saldo') ||
        paymentMethod.toLowerCase().includes('tabungan');

      await rekapSppService.recordPayment({
        studentId: selectedStudent.studentId,
        month: paymentMonth,
        nominal: paymentNominal,
        paymentMethod,
        notes: paymentNotes || undefined,
        kategori: isDeduction ? '0' : '1',
      });

      // ─── Kirim Notifikasi WhatsApp Otomatis ke Wali Santri ───
      const targetPhone = selectedStudent.parentPhone;
      if (targetPhone) {
        try {
          const curBal = selectedStudent.savingsBalance ?? 0;
          const sisaBal = Math.max(0, curBal - paymentNominal);
          const waMessage = whatsappService.formatPotongSPP(
            selectedStudent.name,
            selectedStudent.nisn,
            paymentMonth,
            formatRupiah(paymentNominal),
            formatRupiah(sisaBal),
            paymentNotes || undefined
          );

          await whatsappService.sendMessage({
            phone: targetPhone,
            message: waMessage,
          });
        } catch (waErr) {
          console.warn('Pengiriman WhatsApp notice:', waErr);
        }
      }

      setToastMessage(`Pembayaran SPP ${paymentMonth} an. ${selectedStudent.name} (${formatRupiah(paymentNominal)}) berhasil dicatat!`);
      setTimeout(() => setToastMessage(null), 5000);

      setIsConfirmModalOpen(false);
      setIsDetailModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat pembayaran SPP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate WhatsApp Message for Arrears
  const getWhatsAppMessage = (student: StudentSPPRecord): string => {
    const unpaidList = student.monthlyBills
      .filter((b) => b.status === 'menunggak')
      .map((b) => `• SPP Bulan ${b.month} ${b.year}: ${formatRupiah(b.nominal)}`)
      .join('\n');

    return `Assalamu'alaikum Wr. Wb.

Yth. Wali Santri dari ananda *${student.name}* (Kelas ${student.className}),

Kami dari Bagian Keuangan dan Bendahara Pesantren menginformasikan rekapitulasi status pembayaran SPP Tahun Ajaran ${student.academicYear}:

*Rincian Tunggakan SPP:*
${unpaidList || 'Tidak ada tunggakan'}

*Total Kewajiban Tertunggak:* *${formatRupiah(student.totalArrears)}*

Pembayaran dapat disalurkan melalui rekening resmi pesantren atau Virtual Account BSI/Mandiri santri. 
Konfirmasi pembayaran otomatis terverifikasi di Portal Keuangan.

Jazakumullahu khairan katsiran atas perhatian dan kerjasamanya.
Wassalamu'alaikum Wr. Wb.
_Bendahara & Tata Usaha Keuangan Sekolah_`;
  };

  const handleSendWhatsApp = (student: StudentSPPRecord) => {
    const msg = encodeURIComponent(getWhatsAppMessage(student));
    const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-800 via-indigo-700 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-800/15">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5" /> Dashboard SPP Santri
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-400/30 text-[11px] font-bold">
                T.A. {academicYear}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Dashboard SPP & Arus Kas Masuk</h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-2xl">
              Monitoring penerimaan SPP (nominal standar Rp4.000.000/bulan), pelacakan santri yang menunggak vs lancar, serta penyesuaian nominal pembayaran.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white text-slate-800 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-violet-400"
            >
              {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun Ajaran {yr}
                </option>
              ))}
            </select>

            <button
              onClick={loadData}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white"
              title="Segarkan Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Macro KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Target Tahunan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Target SPP 1 Tahun</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
            {formatRupiah(stats?.totalTargetAnnual || 0)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1">
            {stats?.totalStudents || 0} Santri × 12 Bulan (Rp4jt/bln)
          </span>
        </div>

        {/* 2. Realisasi Masuk */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Realisasi SPP Masuk</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-3">
            {formatRupiah(stats?.totalRealized || 0)}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1">
            Dana SPP terverifikasi masuk
          </span>
        </div>

        {/* 3. Total Tunggakan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Tunggakan SPP</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 tracking-tight mt-3">
            {formatRupiah(stats?.totalArrears || 0)}
          </p>
          <span className="text-[11px] text-rose-700 font-semibold mt-1">
            {stats?.menunggakCount || 0} Santri lewat jatuh tempo
          </span>
        </div>

        {/* 4. Rasio Kelancaran */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Kepatuhan / Kelancaran</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats?.complianceRate || 0}%
            </span>
            <span className="text-xs font-bold text-emerald-600">
              ({stats?.lancarCount || 0}/{stats?.totalStudents || 0} Santri)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.complianceRate || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Arus Kas Masuk 12 Bulan (Monthly Inflow Breakdown Grid) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Distribusi Arus Kas Masuk SPP 12 Bulan</h3>
            <p className="text-[11px] text-slate-400">Tahun Ajaran {academicYear} (Juli s/d Juni)</p>
          </div>
          <Badge variant="primary">Standar: {formatRupiah(DEFAULT_MONTHLY_SPP)} / Santri</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          {stats?.monthlyInflows.map((m) => {
            const pct = m.target > 0 ? Math.round((m.realized / m.target) * 100) : 0;
            const hasArrears = m.arrears > 0;
            return (
              <div
                key={m.month}
                className={`p-3 rounded-2xl border text-xs flex flex-col justify-between transition-all ${
                  hasArrears
                    ? 'border-rose-200 bg-rose-50/40'
                    : m.realized > 0
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">{m.month}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    hasArrears
                      ? 'bg-rose-100 text-rose-800'
                      : m.realized > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {pct}%
                  </span>
                </div>

                <div className="space-y-0.5 my-1">
                  <div className="text-xs font-bold text-slate-900">{formatRupiah(m.realized)}</div>
                  {hasArrears && (
                    <div className="text-[10px] text-rose-600 font-medium">
                      Tunggak: {formatRupiah(m.arrears)}
                    </div>
                  )}
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full ${hasArrears ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Bar & Action Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Status Filter Tabs & Jenjang */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Santri ({stats?.totalStudents || 0})
            </button>
            <button
              onClick={() => setStatusFilter('menunggak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'menunggak'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Menunggak SPP ({stats?.menunggakCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter('lancar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'lancar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pembayaran Lancar ({stats?.lancarCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter('lunas_penuh')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'lunas_penuh'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              }`}
            >
              Lunas 12 Bulan ({stats?.lunasPenuhCount || 0})
            </button>
          </div>

          {/* Jenjang Filter Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 mr-1">Jenjang:</span>
            {JENJANG_OPTIONS.map((j) => (
              <button
                key={j}
                onClick={() => setSelectedJenjang(j)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedJenjang === j
                    ? 'bg-violet-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {j === 'ALL' ? 'Semua Jenjang' : j}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Class Filter & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-100">
          {/* Class Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-1 whitespace-nowrap">Kelas:</span>
            <button
              onClick={() => setSelectedClass('ALL')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedClass === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kelas
            </button>
            {classButtons.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedClass(c.label)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedClass === c.label
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kelas {c.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari santri, NISN, wali..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {/* ─── 12-Month Matrix Table ─── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900">Matriks Pembayaran SPP 12 Bulan per Santri</h3>
            <p className="text-xs text-slate-400">
              Klik pada baris santri atau kotak bulan untuk mencatat/menyesuaikan nominal pembayaran SPP
            </p>
          </div>
          <Badge variant="neutral">{students.length} Data Santri</Badge>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Memuat matriks rekapitulasi SPP...</div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
            Tidak ada data santri ditemukan dengan filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-50 z-10 shadow-sm min-w-[200px]">Santri & Kelas</th>
                  {ACADEMIC_MONTHS.map((m) => (
                    <th key={m.name} className="p-2.5 text-center min-w-[65px]">
                      <span className="block text-[11px]">{m.name.slice(0, 3)}</span>
                    </th>
                  ))}
                  <th className="p-3 text-right min-w-[110px]">Terbayar</th>
                  <th className="p-3 text-right min-w-[110px]">Tunggakan</th>
                  <th className="p-3 text-center min-w-[90px]">Status</th>
                  <th className="p-3 text-center min-w-[130px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const isMenunggak = student.complianceStatus === 'menunggak';
                  return (
                    <tr
                      key={student.studentId}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isMenunggak ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Santri Info (Sticky) */}
                      <td className="p-3 sticky left-0 bg-white z-10 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight hover:text-violet-700 cursor-pointer"
                              onClick={() => handleOpenPaymentForStudent(student)}
                            >
                              {student.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-600">{student.className}</span>
                              <span>•</span>
                              <span>NISN: {student.nisn}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 12 Month Matrix Cells */}
                      {student.monthlyBills.map((bill) => {
                        const isLunas = bill.status === 'lunas';
                        const isNunggak = bill.status === 'menunggak';

                        return (
                          <td key={bill.month} className="p-1.5 text-center">
                            <button
                              onClick={() => handleOpenPaymentForStudent(student, bill.month)}
                              title={`${bill.month} ${bill.year}: ${isLunas ? 'Lunas (' + formatRupiah(bill.nominal) + ')' : isNunggak ? 'Menunggak' : 'Belum Jatuh Tempo'}`}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all text-xs font-bold ${
                                isLunas
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:scale-105'
                                  : isNunggak
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:scale-105 animate-pulse'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              {isLunas ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              ) : isNunggak ? (
                                <span className="text-[10px] font-extrabold text-rose-700">!</span>
                              ) : (
                                <span className="text-[10px] text-slate-300">•</span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Terbayar */}
                      <td className="p-3 text-right font-extrabold text-emerald-700">
                        {formatRupiah(student.totalPaid)}
                      </td>

                      {/* Tunggakan */}
                      <td className="p-3 text-right">
                        {student.totalArrears > 0 ? (
                          <span className="font-extrabold text-rose-600">
                            {formatRupiah(student.totalArrears)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Rp0</span>
                        )}
                      </td>

                      {/* Status Tag */}
                      <td className="p-3 text-center">
                        {isMenunggak ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" /> {student.unpaidMonthsCount} Bln
                          </span>
                        ) : student.complianceStatus === 'lunas_penuh' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800">
                            Lunas 12 Bln
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Lancar
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isMenunggak && (
                            <button
                              onClick={() => setReminderStudent(student)}
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Kirim Pengingat WhatsApp ke Wali"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPaymentForStudent(student)}
                            className="text-[11px] py-1 px-2"
                          >
                            Kelola SPP
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal Detail SPP & Form Pelunasan / Koreksi Nominal ─── */}
      {isDetailModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-8 sm:zoom-in-95 pb-safe">
            {/* Mobile Drag Indicator Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Kelola & Catat Pembayaran SPP</h3>
                <p className="text-xs text-slate-500">
                  {selectedStudent.name} • Kelas {selectedStudent.className} (NISN: {selectedStudent.nisn})
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Info Wali & Tunggakan */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Wali Santri & Telepon</span>
                <span className="font-bold text-slate-900 block">{selectedStudent.parentName}</span>
                <span className="text-slate-500 text-[11px]">{selectedStudent.parentPhone}</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                selectedStudent.totalArrears > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <span className="text-[10px] uppercase font-bold block opacity-75">Status Tagihan</span>
                <span className="text-sm font-extrabold block">
                  {selectedStudent.totalArrears > 0
                    ? `Tunggakan ${formatRupiah(selectedStudent.totalArrears)}`
                    : 'Semua Bulan Terlunasi'}
                </span>
                <span className="text-[10px] block opacity-80 mt-0.5">
                  Terbayar: {formatRupiah(selectedStudent.totalPaid)} / {formatRupiah(selectedStudent.totalTarget)}
                </span>
              </div>
            </div>

            {/* Rincian Status 12 Bulan Grid (Wajib Berurutan) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700 block">Pilih Bulan Pembayaran:</span>
                <span className="text-[10px] text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                  Wajib Berurutan (Juli ➔ Juni)
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {(() => {
                  const firstUnpaidBill = selectedStudent.monthlyBills.find((b) => b.status !== 'lunas');
                  const firstUnpaidIndex = firstUnpaidBill ? firstUnpaidBill.monthIndex : 13;

                  return selectedStudent.monthlyBills.map((b) => {
                    const isSelected = paymentMonth === b.month;
                    const isNextToPay = b.monthIndex === firstUnpaidIndex;
                    const isLockedFuture = b.monthIndex > firstUnpaidIndex;

                    return (
                      <button
                        key={b.month}
                        type="button"
                        onClick={() => {
                          if (isLockedFuture) {
                            alert(
                              `Pembayaran SPP harus berurutan!\n\nSilakan selesaikan tagihan Bulan ${firstUnpaidBill?.month} terlebih dahulu sebelum membayar bulan ${b.month}.`
                            );
                            setPaymentMonth(firstUnpaidBill?.month || 'Juli');
                            setPaymentNominal(firstUnpaidBill?.nominal || DEFAULT_MONTHLY_SPP);
                            return;
                          }
                          setPaymentMonth(b.month);
                          setPaymentNominal(b.nominal || DEFAULT_MONTHLY_SPP);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50 text-violet-900 ring-2 ring-violet-500 font-bold shadow-sm'
                            : b.status === 'lunas'
                            ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                            : isNextToPay
                            ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold shadow-sm ring-1 ring-amber-400/50'
                            : 'border-slate-200 bg-slate-50/70 text-slate-400 opacity-60'
                        }`}
                      >
                        <span className="text-xs font-bold block">{b.month}</span>
                        <span className="text-[9px] font-semibold block mt-0.5">
                          {b.status === 'lunas'
                            ? '✓ Lunas'
                            : isNextToPay
                            ? '➔ Bayar Ini'
                            : b.status === 'menunggak'
                            ? '! Nunggak'
                            : 'Mendatang'}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Form Rekam Pembayaran */}
            <form onSubmit={handlePreparePaymentConfirm} className="space-y-3 pt-2 border-t border-slate-100">
              <div className="p-3 bg-violet-50/70 border border-violet-200/80 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between items-center text-violet-900 font-bold">
                  <span>Nominal Default Standar: {formatRupiah(DEFAULT_MONTHLY_SPP)}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Nominal dapat diedit manual di bawah untuk mengakomodasi tunggakan khusus, diskon beasiswa, atau cicilan.
                </p>
              </div>

              <Input
                label={`Nominal Pembayaran SPP Bulan ${paymentMonth} (Rp)`}
                type="number"
                value={paymentNominal || ''}
                onChange={(e) => setPaymentNominal(Number(e.target.value))}
                helperText="Bisa disesuaikan secara manual"
              />

              {/* ─── Metode Pembayaran Tunggal: Potong Saldo Tabungan ─── */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Metode Pembayaran:</label>
                <div className="p-3 bg-violet-50/70 border border-violet-200/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-violet-600/20">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Potong Saldo Tabungan Santri</span>
                      <span className="text-[10px] text-slate-500 block">
                        Pelunasan otomatis memotong saldo tabungan yang masuk dari Bank (VA)
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-violet-100 text-violet-800 rounded-full text-[10px] font-extrabold border border-violet-200">
                    Otomatis
                  </span>
                </div>
              </div>

              {/* ─── Preview Saldo Tabungan Santri ─── */}
              {(() => {
                const curSavings = selectedStudent.savingsBalance ?? 0;
                const isInsufficient = curSavings < paymentNominal;

                return (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                      isInsufficient
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600">Saldo Tabungan Santri:</span>
                      <span className="font-extrabold text-sm">{formatRupiah(curSavings)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600">Nominal SPP yang Dipotong:</span>
                      <span className="font-bold">{formatRupiah(paymentNominal)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-600">Estimasi Sisa Saldo:</span>
                      <span
                        className={`font-extrabold ${
                          isInsufficient ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatRupiah(curSavings - paymentNominal)}
                      </span>
                    </div>

                    {isInsufficient && (
                      <div className="mt-2 p-2.5 bg-rose-100 rounded-xl border border-rose-300 text-rose-800 text-[11px] font-bold flex items-start gap-1.5">
                        <span className="text-sm leading-none">⚠️</span>
                        <span>
                          Saldo tabungan santri tidak mencukupi untuk pemotongan SPP sebesar{' '}
                          {formatRupiah(paymentNominal)}. Saldo saat ini hanya{' '}
                          {formatRupiah(curSavings)}. Transaksi tidak dapat diproses.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <Input
                label="Catatan Transaksi (Opsional)"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Contoh: Pelunasan tunggakan SPP via transfer wali"
              />

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setIsDetailModalOpen(false)}
                  type="button"
                >
                  Tutup
                </Button>
                {(() => {
                  const isDeduction =
                    paymentMethod.toLowerCase().includes('potong') ||
                    paymentMethod.toLowerCase().includes('saldo') ||
                    paymentMethod.toLowerCase().includes('tabungan');
                  const curSavings = selectedStudent.savingsBalance ?? 0;
                  const isInsufficient = isDeduction && curSavings < paymentNominal;

                  return (
                    <Button
                      variant="primary"
                      fullWidth
                      type="submit"
                      disabled={isInsufficient || isSubmitting}
                      className={
                        isInsufficient
                          ? 'bg-slate-300 hover:bg-slate-300 text-slate-500 cursor-not-allowed border-slate-300 shadow-none'
                          : 'bg-violet-600 hover:bg-violet-700'
                      }
                    >
                      {isInsufficient ? 'Saldo Tabungan Tidak Cukup' : 'Simpan Pembayaran SPP'}
                    </Button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Konfirmasi Pembayaran SPP ─── */}
      <ConfirmActionModal
        isOpen={isConfirmModalOpen}
        title="Konfirmasi Pencatatan Pembayaran SPP"
        description={`Pastikan data penerimaan dana SPP bulan ${paymentMonth} ${academicYear} untuk ananda ${selectedStudent?.name} sudah sesuai.`}
        amount={paymentNominal}
        amountLabel="Nominal Pembayaran"
        details={[
          { label: 'Nama Santri', value: selectedStudent?.name || '-' },
          { label: 'Kelas / NISN', value: `${selectedStudent?.className} • ${selectedStudent?.nisn}` },
          { label: 'Bulan Tagihan', value: `${paymentMonth} (${academicYear})` },
          { label: 'Metode Pembayaran', value: paymentMethod },
        ]}
        confirmLabel="Ya, Rekam Pembayaran"
        variant="primary"
        isLoading={isSubmitting}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleExecutePayment}
      />

      {/* ─── Modal Preview WhatsApp Reminder ─── */}
      {reminderStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-8 sm:zoom-in-95 pb-safe">
            {/* Mobile Drag Indicator Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Send className="w-4 h-4" />
                Pengingat Tagihan SPP via WhatsApp
              </div>
              <button
                onClick={() => setReminderStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-slate-500">Penerima: </span>
              <strong className="text-slate-900">{reminderStudent.parentName}</strong>
              <span className="text-slate-500"> ({reminderStudent.parentPhone})</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed text-slate-700">
              {getWhatsAppMessage(reminderStudent)}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setReminderStudent(null)}
              >
                Batal
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leftIcon={<Send className="w-4 h-4" />}
                onClick={() => {
                  handleSendWhatsApp(reminderStudent);
                  setReminderStudent(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Kirim via WhatsApp Web
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
