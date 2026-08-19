import React, { useState, useEffect, useCallback } from 'react';
import { tabunganService } from '../../services/tabunganService';
import { rekapSppService } from '../../services/rekapSppService';
import { whatsappService } from '../../services/whatsappService';
import {
  StudentUser,
  SaveMoneyTransaction,
  CreateSaveMoneyPayload,
} from '../../types/backend';
import {
  normalizeClassButtons,
  resolveStudentClassLabel,
  isStudentInClassFilter,
  NormalizedClassButton,
} from '../../utils/classHelper';
import { formatRupiah } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ConfirmActionModal } from '../../components/common/ConfirmActionModal';
import {
  PlusCircle,
  MinusCircle,
  Search,
  CheckCircle2,
  History,
  CreditCard,
  Banknote,
  Building2,
  UserCheck,
} from 'lucide-react';

// ─── Tipe Tag Tabungan (Pemasukan & Penarikan) ────────────────────────────────
type TagTabungan = 'uang_saku' | 'spp';

interface TagOption {
  value: TagTabungan;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
}

const TAG_OPTIONS_TARIK: TagOption[] = [
  {
    value: 'uang_saku',
    label: 'Penarikan Uang Saku',
    desc: 'Penarikan saldo tunai untuk uang saku / jajan harian santri',
    icon: <Banknote className="w-4 h-4" />,
    color: 'border-slate-200 text-slate-700',
    activeColor: 'border-blue-600 bg-blue-50/70 text-blue-800',
  },
  {
    value: 'spp',
    label: 'Penarikan untuk SPP',
    desc: 'Pemotongan saldo tabungan santri untuk pelunasan tagihan SPP bulanan',
    icon: <CreditCard className="w-4 h-4" />,
    color: 'border-slate-200 text-slate-700',
    activeColor: 'border-violet-600 bg-violet-50/70 text-violet-800',
  },
];

// ─── Badge Helper: Tag Transaksi ──────────────────────────────────────────────
export function TagBadge({ tag }: { tag: string | null | undefined }) {
  if (!tag) return null;
  if (tag === 'spp') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800">
        <CreditCard className="w-3 h-3" /> SPP
      </span>
    );
  }
  if (tag === 'uang_saku') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
        <Banknote className="w-3 h-3" /> Uang Saku
      </span>
    );
  }
  if (tag === 'kantin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
        Kantin
      </span>
    );
  }
  if (tag === 'kafe') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
        Kafe
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
      {tag}
    </span>
  );
}

// ─── Komponen Utama ───────────────────────────────────────────────────────────
export const TabunganPage: React.FC = () => {
  const [classButtons, setClassButtons] = useState<NormalizedClassButton[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [riwayatPerSiswa, setRiwayatPerSiswa] = useState<Record<string, SaveMoneyTransaction[]>>({});
  const [selectedClassId, setSelectedClassId] = useState<string | number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal Action State
  const [activeStudent, setActiveStudent] = useState<StudentUser | null>(null);
  const [actionType, setActionType] = useState<'menabung' | 'mengambil'>('menabung');
  const [selectedTag, setSelectedTag] = useState<TagTabungan>('uang_saku');
  const [sirkulasi, setSirkulasi] = useState<number>(50000);
  const [ketMoney, setKetMoney] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Detail Riwayat Modal
  const [viewHistoryStudent, setViewHistoryStudent] = useState<StudentUser | null>(null);

  const loadTabunganData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await tabunganService.init();
      const normalizedButtons = normalizeClassButtons(res.class_buttons);
      setClassButtons(normalizedButtons);
      setStudents(res.users || []);
      setRiwayatPerSiswa(res.riwayat_per_siswa || {});
    } catch (err) {
      console.warn('Gagal memuat data tabungan:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabunganData();
  }, [loadTabunganData]);

  const filteredStudents = students.filter((s) => {
    const matchClass = isStudentInClassFilter(s, selectedClassId, classButtons);
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  const getStudentTransactions = (student: StudentUser): SaveMoneyTransaction[] => {
    if (!riwayatPerSiswa) return [];

    const uIdStr = String(student.id ?? '');
    if (uIdStr && riwayatPerSiswa[uIdStr] && riwayatPerSiswa[uIdStr].length > 0) {
      return riwayatPerSiswa[uIdStr];
    }

    const uNisn = String(student.nisn || '').trim();
    if (uNisn && riwayatPerSiswa[uNisn] && riwayatPerSiswa[uNisn].length > 0) {
      return riwayatPerSiswa[uNisn];
    }

    const targetId = Number(student.id || 0);
    const targetName = String(student.name || '').trim().toLowerCase();

    for (const [, list] of Object.entries(riwayatPerSiswa)) {
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
  };

  const getLatestSaldo = (studentOrId: StudentUser | number): number => {
    let txs: SaveMoneyTransaction[] = [];
    let directBalance: number | undefined = undefined;

    if (typeof studentOrId === 'object' && studentOrId !== null) {
      txs = getStudentTransactions(studentOrId);
      const rawDirect = (studentOrId as any).balance ?? (studentOrId as any).saldo ?? (studentOrId as any).total_saldo;
      if (rawDirect !== undefined && rawDirect !== null) {
        directBalance = Number(rawDirect);
      }
    } else {
      const student = students.find((s) => s.id === studentOrId);
      if (student) {
        txs = getStudentTransactions(student);
        const rawDirect = (student as any).balance ?? (student as any).saldo ?? (student as any).total_saldo;
        if (rawDirect !== undefined && rawDirect !== null) {
          directBalance = Number(rawDirect);
        }
      } else {
        txs = riwayatPerSiswa[String(studentOrId)] || [];
      }
    }

    if (typeof directBalance === 'number' && directBalance >= 0) {
      return directBalance;
    }

    if (txs.length === 0) return 0;

    // 1. Cek saldo_sesudah dari mutasi terakhir
    const lastTx = txs[txs.length - 1];
    if (typeof lastTx.saldo_sesudah === 'number' && lastTx.saldo_sesudah > 0) {
      return lastTx.saldo_sesudah;
    }

    // 2. Hitung saldo riil mutasi masuk dikurangi mutasi keluar secara ketat
    let computedSaldo = 0;
    txs.forEach((t) => {
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
        computedSaldo -= amt;
      } else {
        computedSaldo += amt;
      }
    });

    return Math.max(0, computedSaldo);
  };

  const handleOpenActionModal = (student: StudentUser, type: 'menabung' | 'mengambil') => {
    setActiveStudent(student);
    setActionType(type);
    setSelectedTag('uang_saku'); // default tag
    setSirkulasi(50000);
    setKetMoney(type === 'menabung' ? 'Setoran uang saku santri' : 'Penarikan uang saku tunai');
    setIsModalOpen(true);
  };

  const handleTagChange = (tag: TagTabungan) => {
    setSelectedTag(tag);

    const monthStr = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    if (actionType === 'menabung') {
      setKetMoney('Setoran uang saku santri');
      setSirkulasi(50000);
    } else {
      // Penarikan
      if (tag === 'spp') {
        setKetMoney(`Penarikan saldo untuk pembayaran SPP Bulan ${monthStr}`);
        setSirkulasi(4000000); // Default nominal SPP Rp4.000.000
      } else {
        setKetMoney('Penarikan uang saku tunai');
        setSirkulasi(50000);
      }
    }
  };

  const handlePrepareConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (sirkulasi <= 0) {
      alert('Nominal harus lebih dari Rp0.');
      return;
    }
    if (actionType === 'mengambil' && activeStudent) {
      const curBalance = getLatestSaldo(activeStudent.id);
      if (curBalance < sirkulasi) {
        alert(`Saldo tidak mencukupi. Saldo saat ini: ${formatRupiah(curBalance)}`);
        return;
      }
    }
    setIsModalOpen(false);
    setIsConfirmOpen(true);
  };

  const handleExecuteStore = async () => {
    if (!activeStudent) return;
    setIsSubmitting(true);
    try {
      const monthStr = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const finalKet =
        ketMoney?.trim() ||
        (selectedTag === 'spp'
          ? `Pembayaran SPP Bulan ${monthStr}`
          : actionType === 'menabung'
          ? 'Setoran uang saku'
          : 'Penarikan uang saku');

      const payload: CreateSaveMoneyPayload = {
        user_id: activeStudent.id,
        sirkulasi,
        kategori: actionType === 'menabung' ? '1' : '0',
        tag: selectedTag,
        ket_money: finalKet,
      };

      const res = await tabunganService.store(payload);

      let successText = res.message;
      if (!successText) {
        if (actionType === 'menabung') {
          successText = selectedTag === 'spp'
            ? `Setoran SPP ${formatRupiah(sirkulasi)} berhasil disimpan!`
            : `Setoran uang saku ${formatRupiah(sirkulasi)} berhasil disimpan!`;
        } else {
          successText = selectedTag === 'spp'
            ? `Penarikan saldo untuk SPP ${formatRupiah(sirkulasi)} berhasil diproses!`
            : `Penarikan uang saku ${formatRupiah(sirkulasi)} berhasil diproses!`;
        }
      }

      // Sinkronisasi otomatis ke Dashboard SPP HANYA ketika aksi adalah PENARIKAN (actionType === 'mengambil') dengan tag SPP
      // Jika menabung (kategori: 1), saldo bertambah tapi SPP belum lunas
      if (actionType === 'mengambil' && selectedTag === 'spp') {
        try {
          await rekapSppService.recordPayment({
            studentId: String(activeStudent.id),
            month: 'Agustus', // akan dialokasikan ke bulan-bulan tertunggak secara otomatis
            nominal: sirkulasi,
            paymentMethod: 'Pemotongan Saldo Tabungan (SPP)',
            notes: finalKet,
            skipApiStore: true, // Karena tabunganService.store sudah dieksekusi di atas
            kategori: '0',
          });
        } catch (sppSyncErr) {
          console.warn('Sync rekap SPP notice:', sppSyncErr);
        }
      }

      // ─── Kirim Notifikasi WhatsApp Otomatis ke Nomor Santri / Wali ───
      if (activeStudent.phone) {
        try {
          let waMessage = '';
          if (actionType === 'menabung') {
            const newBalance = getLatestSaldo(activeStudent) + sirkulasi;
            waMessage = whatsappService.formatSetorUangSaku(
              activeStudent.name,
              activeStudent.nisn,
              formatRupiah(sirkulasi),
              formatRupiah(newBalance),
              finalKet
            );
          } else if (selectedTag === 'spp') {
            const newBalance = Math.max(0, getLatestSaldo(activeStudent) - sirkulasi);
            const monthStr = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            waMessage = whatsappService.formatPotongSPP(
              activeStudent.name,
              activeStudent.nisn,
              monthStr,
              formatRupiah(sirkulasi),
              formatRupiah(newBalance),
              finalKet
            );
          } else {
            const newBalance = Math.max(0, getLatestSaldo(activeStudent) - sirkulasi);
            waMessage = whatsappService.formatTarikUangSaku(
              activeStudent.name,
              activeStudent.nisn,
              formatRupiah(sirkulasi),
              formatRupiah(newBalance),
              finalKet
            );
          }

          if (waMessage) {
            await whatsappService.sendMessage({
              phone: activeStudent.phone,
              message: waMessage,
            });
          }
        } catch (waErr) {
          console.warn('Pengiriman WhatsApp notice:', waErr);
        }
      }

      setToastMessage({ text: successText, type: 'success' });
      setTimeout(() => setToastMessage(null), 5000);

      setIsConfirmOpen(false);
      setActiveStudent(null);
      await loadTabunganData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi tabungan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTarikSpp = actionType === 'mengambil' && selectedTag === 'spp';

  // Label konfirmasi dinamis berdasarkan aksi & tag
  const getConfirmTitle = () => {
    if (actionType === 'mengambil') {
      return selectedTag === 'spp'
        ? 'Konfirmasi Pemotongan Saldo untuk SPP'
        : 'Konfirmasi Penarikan Uang Saku';
    }
    return 'Konfirmasi Setoran Uang Saku';
  };

  const getConfirmDescription = () => {
    const baseInfo = `${activeStudent?.name} — ${formatRupiah(sirkulasi)}`;
    if (actionType === 'mengambil') {
      if (selectedTag === 'spp') {
        return `Potong saldo tabungan ${baseInfo} untuk pelunasan tagihan SPP ${activeStudent?.name}. Transaksi SPP akan otomatis lunas di Dashboard SPP.`;
      }
      return `Proses penarikan uang saku tunai ${baseInfo}? Notifikasi mutasi santri dicatat otomatis.`;
    }
    return `Setoran uang saku tunai ${baseInfo} untuk santri ${activeStudent?.name}.`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-4 border rounded-2xl flex items-center gap-3 text-sm shadow-sm animate-in fade-in slide-in-from-top-2 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-700/15">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Portal Bendahara
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-semibold border border-emerald-400/30">
            Realtime Terhubung API
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tabungan & Mutasi Rekening Santri</h1>
        <p className="text-blue-100 text-sm mt-1 max-w-2xl">
          Kelola simpanan uang saku santri dan eksekusi pemotongan saldo tabungan untuk pembayaran SPP bulanan.
        </p>
      </div>

      {/* ─── Search & Class Filter ─── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari santri berdasarkan nama / NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold self-end md:self-center">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Total: <strong className="text-slate-900">{filteredStudents.length} Santri</strong>
          </div>
        </div>

        {/* Filter Kelas */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Filter Kelas Santri:</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedClassId('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedClassId === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kelas
            </button>
            {classButtons.map((btn) => (
              <button
                key={btn.value}
                type="button"
                onClick={() => setSelectedClassId(btn.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedClassId === btn.value
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kelas {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Grid Kartu Rekening Santri ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            Memuat data tabungan santri...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            Tidak ada data santri pada kelas atau pencarian ini.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const currentSaldo = getLatestSaldo(student);
            const txList = getStudentTransactions(student);
            const txCount = txList.length;

            // Breakdown tag dari riwayat secara akurat
            const sppIn = txList
              .filter((t) => {
                const isOut =
                  t.jenis_transaksi?.includes('Mengambil') ||
                  t.jenis_transaksi?.includes('Tarik') ||
                  t.jenis_transaksi?.includes('-') ||
                  String(t.money_flag_id) === '2' ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('penarikan')) ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('pemotongan')) ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('potong saldo'));
                return t.tag === 'spp' && !isOut;
              })
              .reduce((acc, t) => acc + Math.abs(t.jumlah), 0);

            const sppOut = txList
              .filter((t) => {
                const isOut =
                  t.jenis_transaksi?.includes('Mengambil') ||
                  t.jenis_transaksi?.includes('Tarik') ||
                  t.jenis_transaksi?.includes('-') ||
                  String(t.money_flag_id) === '2' ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('penarikan')) ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('pemotongan')) ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('potong saldo'));
                return t.tag === 'spp' && isOut;
              })
              .reduce((acc, t) => acc + Math.abs(t.jumlah), 0);

            const uangSakuIn = txList
              .filter((t) => {
                const isOut =
                  t.jenis_transaksi?.includes('Mengambil') ||
                  t.jenis_transaksi?.includes('Tarik') ||
                  t.jenis_transaksi?.includes('-') ||
                  String(t.money_flag_id) === '2' ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('penarikan')) ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('pemotongan')) ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('potong saldo'));
                return t.tag === 'uang_saku' && !isOut;
              })
              .reduce((acc, t) => acc + Math.abs(t.jumlah), 0);

            const uangSakuOut = txList
              .filter((t) => {
                const isOut =
                  t.jenis_transaksi?.includes('Mengambil') ||
                  t.jenis_transaksi?.includes('Tarik') ||
                  t.jenis_transaksi?.includes('-') ||
                  String(t.money_flag_id) === '2' ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('penarikan')) ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('pemotongan')) ||
                  (t.keterangan && t.keterangan.toLowerCase().includes('potong saldo'));
                return t.tag === 'uang_saku' && isOut;
              })
              .reduce((acc, t) => acc + Math.abs(t.jumlah), 0);

            return (
              <div
                key={student.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{student.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">NISN: {student.nisn}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold">
                      Kelas {resolveStudentClassLabel(student, classButtons)}
                    </span>
                  </div>

                  {/* Saldo Total */}
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium block">Total Saldo Rekening</span>
                    <span className="text-xl font-extrabold text-blue-700 block mt-0.5">
                      {formatRupiah(currentSaldo)}
                    </span>
                  </div>

                  {/* Breakdown Mutasi */}
                  {txCount > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-1 font-bold text-blue-800 mb-1">
                          <Banknote className="w-3 h-3 text-blue-600" /> Uang Saku
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Masuk:</span>
                          <span className="font-semibold text-emerald-600">+{formatRupiah(uangSakuIn)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 mt-0.5">
                          <span>Keluar:</span>
                          <span className="font-semibold text-rose-600">-{formatRupiah(uangSakuOut)}</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-violet-50/70 border border-violet-200 rounded-xl">
                        <div className="flex items-center gap-1 font-bold text-violet-800 mb-1">
                          <CreditCard className="w-3 h-3 text-violet-600" /> SPP Terpadu
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Bank (VA):</span>
                          <span className="font-semibold text-emerald-600">+{formatRupiah(sppIn)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 mt-0.5">
                          <span>Potong SPP:</span>
                          <span className="font-semibold text-rose-600">-{formatRupiah(sppOut)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenActionModal(student, 'menabung')}
                    >
                      Setor Uang Saku
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<MinusCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenActionModal(student, 'mengambil')}
                    >
                      Tarik (-)
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftIcon={<History className="w-3.5 h-3.5" />}
                    onClick={() => setViewHistoryStudent(student)}
                    className="text-slate-600"
                  >
                    Lihat Riwayat Saldo
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Modal Input Transaksi (Setor Uang Saku / Tarik Saldo) ─── */}
      {isModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'menabung' ? 'Setor Uang Saku Santri (+)' : 'Penarikan / Pemotongan Saldo (-)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Info Santri & Saldo Berjalan */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500">Santri: </span>
              <strong className="text-slate-900">{activeStudent.name}</strong>
              <span className="text-slate-500"> (NISN: {activeStudent.nisn})</span>
              <div className="flex justify-between mt-1 pt-1 border-t border-slate-200">
                <span className="text-slate-500">Saldo Rekening Saat Ini:</span>
                <strong className="text-blue-700">{formatRupiah(getLatestSaldo(activeStudent.id))}</strong>
              </div>
            </div>

            <form onSubmit={handlePrepareConfirm} className="space-y-4">
              {/* ── Konten Khusus Setoran Uang Saku ── */}
              {actionType === 'menabung' ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                    <Banknote className="w-4 h-4 flex-shrink-0 text-blue-700 mt-0.5" />
                    <div>
                      <span className="font-bold block">Setoran Uang Saku Santri</span>
                      <span className="text-[11px] text-slate-600 mt-0.5 block">
                        Digunakan untuk mencatat penerimaan titipan uang saku tunai dari wali santri melalui pos keuangan.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-violet-50/70 border border-violet-200/80 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-violet-900">
                      <Building2 className="w-3.5 h-3.5 text-violet-700" />
                      <span>Setoran SPP Otomatis Terintegrasi Bank (VA)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Setoran SPP dilakukan langsung oleh wali santri ke rekening Virtual Account Bank, kemudian data saldo tabungan otomatis ditarik & tersinkronisasi via API Bank.
                    </p>
                  </div>
                </div>
              ) : (
                /* ── Pilihan Tag Penarikan (Uang Saku atau SPP) ── */
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Pilih Tujuan Penarikan Saldo:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TAG_OPTIONS_TARIK.map((opt) => {
                      const isActive = selectedTag === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleTagChange(opt.value)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all ${
                            isActive ? opt.activeColor : opt.color + ' hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {opt.icon}
                            <span className="text-xs font-bold">{opt.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 leading-tight block">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Banner Info Khusus Penarikan untuk SPP ── */}
              {isTarikSpp && (
                <div className="p-3.5 bg-violet-50/80 border border-violet-200 rounded-2xl flex items-start gap-2.5 text-xs text-violet-900">
                  <CreditCard className="w-4 h-4 flex-shrink-0 text-violet-700 mt-0.5" />
                  <div>
                    <span className="font-bold block">Pemotongan Saldo Tabungan untuk SPP</span>
                    <span className="text-[11px] text-slate-600 mt-0.5 block">
                      Saldo rekening santri akan dipotong langsung untuk pelunasan tagihan SPP bulanan. Tagihan pada Dashboard SPP otomatis berstatus lunas.
                    </span>
                  </div>
                </div>
              )}

              {/* Pilihan Nominal Cepat (Hanya untuk Uang Saku) */}
              {selectedTag === 'uang_saku' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Nominal Cepat Uang Saku:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[20000, 50000, 100000, 150000, 200000, 500000].map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => setSirkulasi(nom)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                          sirkulasi === nom
                            ? 'border-blue-600 bg-blue-50 text-blue-800'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {formatRupiah(nom)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isTarikSpp && (
                <div className="p-3 bg-violet-50/70 border border-violet-200/80 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between items-center text-violet-900 font-bold">
                    <span>Nominal Standar SPP Bulanan</span>
                    <span className="text-sm font-extrabold text-violet-700">{formatRupiah(4000000)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Nominal default Rp4.000.000 otomatis disiapkan. Anda dapat mengedit nominal pada kolom di bawah jika santri memiliki penarikan bertahap.
                  </p>
                </div>
              )}

              <Input
                label="Nominal Transaksi (Rp)"
                type="number"
                value={sirkulasi || ''}
                onChange={(e) => setSirkulasi(Number(e.target.value))}
                helperText={selectedTag === 'spp' ? 'Dapat disesuaikan secara manual' : undefined}
              />

              <Input
                label="Keterangan Transaksi"
                value={ketMoney}
                onChange={(e) => setKetMoney(e.target.value)}
                placeholder={
                  actionType === 'menabung'
                    ? 'Contoh: Titipan uang saku santri pekan ini'
                    : selectedTag === 'spp'
                    ? 'Contoh: Pembayaran SPP Agustus 2026 via saldo tabungan'
                    : 'Contoh: Penarikan uang saku tunai santri'
                }
              />

              {/* ─── Peringatan Saldo Tabungan Tidak Cukup saat Penarikan ─── */}
              {(() => {
                if (actionType !== 'mengambil' || !activeStudent) return null;
                const curBalance = getLatestSaldo(activeStudent.id);
                const isInsufficient = curBalance < sirkulasi;

                if (!isInsufficient) return null;

                return (
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <span className="text-base leading-none">⚠️</span>
                    <div>
                      <span className="font-bold block">Saldo Tabungan Tidak Mencukupi!</span>
                      <span className="text-[11px] mt-0.5 block">
                        Saldo saat ini hanya <strong>{formatRupiah(curBalance)}</strong>, sedangkan nominal penarikan/pemotongan{' '}
                        <strong>{formatRupiah(sirkulasi)}</strong>. Transaksi tidak dapat diproses.
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Batal
                </Button>
                {(() => {
                  const curBalance = activeStudent ? getLatestSaldo(activeStudent.id) : 0;
                  const isInsufficient = actionType === 'mengambil' && curBalance < sirkulasi;

                  return (
                    <Button
                      variant={actionType === 'menabung' ? 'primary' : selectedTag === 'spp' ? 'primary' : 'danger'}
                      fullWidth
                      type="submit"
                      disabled={isInsufficient}
                      className={
                        isInsufficient
                          ? 'bg-slate-300 hover:bg-slate-300 text-slate-500 cursor-not-allowed border-slate-300 shadow-none'
                          : selectedTag === 'spp'
                          ? 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500'
                          : ''
                      }
                    >
                      {isInsufficient
                        ? 'Saldo Tidak Cukup'
                        : actionType === 'menabung'
                        ? 'Simpan Setoran Uang Saku'
                        : isTarikSpp
                        ? 'Lanjut Potong SPP'
                        : 'Lanjut Konfirmasi'}
                    </Button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmActionModal
        isOpen={isConfirmOpen}
        title={getConfirmTitle()}
        description={getConfirmDescription()}
        amount={sirkulasi}
        confirmLabel={
          actionType === 'mengambil'
            ? selectedTag === 'spp'
              ? 'Ya, Potong Saldo untuk SPP'
              : 'Ya, Tarik Saldo'
            : selectedTag === 'spp'
            ? 'Ya, Rekam Pembayaran SPP'
            : 'Ya, Setor Uang Saku'
        }
        variant={actionType === 'menabung' || selectedTag === 'spp' ? 'primary' : 'danger'}
        isLoading={isSubmitting}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteStore}
      />

      {/* Modal Riwayat Mutasi Siswa (dengan badge tag) */}
      {viewHistoryStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Riwayat Mutasi Santri</h3>
                <p className="text-xs text-slate-500">{viewHistoryStudent.name} • NISN: {viewHistoryStudent.nisn}</p>
              </div>
              <button
                onClick={() => setViewHistoryStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const historyList = getStudentTransactions(viewHistoryStudent);
                if (historyList.length === 0) {
                  return <p className="text-xs text-slate-400 text-center py-8">Belum ada riwayat transaksi.</p>;
                }
                return historyList.map((tx, idx) => {
                  const isIn = tx.jenis_transaksi?.includes('+');
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-bold text-slate-900 truncate">
                            {tx.keterangan || (isIn ? 'Setoran Dana' : 'Penarikan / Belanja')}
                          </span>
                          {/* Tag badge */}
                          {tx.tag && <TagBadge tag={tx.tag} />}
                        </div>
                        <span className="text-[11px] text-slate-400">{tx.tanggal_transaksi}</span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span
                          className={`font-bold block ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}
                        >
                          {isIn ? '+' : '-'}{formatRupiah(tx.jumlah)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Saldo: {formatRupiah(tx.saldo_sesudah)}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

