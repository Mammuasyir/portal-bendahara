import React, { useState, useEffect } from 'react';
import { belanjaService } from '../../services/belanjaService';
import { tabunganService } from '../../services/tabunganService';
import { whatsappService } from '../../services/whatsappService';
import {
  StudentUser,
  BelanjaTransaction,
  SaveMoneyTransaction,
  CreateBelanjaPayload,
} from '../../types/backend';
import { formatRupiah } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ConfirmActionModal } from '../../components/common/ConfirmActionModal';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Edit2,
  Upload,
  AlertTriangle,
} from 'lucide-react';

const MENU_PRESETS = [
  { name: 'Nasi Goreng Komplit', price: 15000 },
  { name: 'Mie Ayam Bakso', price: 12000 },
  { name: 'Roti Bakar Cokelat', price: 8000 },
  { name: 'Es Teh Manis', price: 4000 },
  { name: 'Susu UHT Cokelat', price: 6000 },
  { name: 'Snack / Biskuit', price: 5000 },
];

export const BelanjaPage: React.FC = () => {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [saldoPerSiswa, setSaldoPerSiswa] = useState<Record<string, number>>({});
  const [riwayatPerSiswa, setRiwayatPerSiswa] = useState<Record<string, SaveMoneyTransaction[]>>({});
  const [lockedTag, setLockedTag] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<BelanjaTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [_isLoading, setIsLoading] = useState<boolean>(true);

  // Form Belanja State
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [sirkulasi, setSirkulasi] = useState<number>(0);
  const [tag, setTag] = useState<string>('kantin');
  const [ketMoney, setKetMoney] = useState<string>('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<BelanjaTransaction | null>(null);
  const [editSirkulasi, setEditSirkulasi] = useState<number>(0);
  const [editKetMoney, setEditKetMoney] = useState<string>('');
  const [editInvoiceFile, setEditInvoiceFile] = useState<File | null>(null);

  // Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadBelanjaData = async () => {
    setIsLoading(true);
    try {
      const [initRes, recentRes, tabunganInitRes] = await Promise.all([
        belanjaService.init(),
        belanjaService.getRecent(),
        tabunganService.init().catch(() => null),
      ]);

      setStudents(initRes.users || []);
      setSaldoPerSiswa(initRes.saldo_per_siswa || {});
      if (tabunganInitRes && tabunganInitRes.riwayat_per_siswa) {
        setRiwayatPerSiswa(tabunganInitRes.riwayat_per_siswa);
      }
      setLockedTag(initRes.locked_tag);
      if (initRes.locked_tag) {
        setTag(initRes.locked_tag);
      }
      setTransactions(recentRes.transactions || []);

      if (initRes.users?.length > 0 && !selectedStudent) {
        setSelectedStudent(initRes.users[0]);
      }
    } catch (err) {
      console.warn('Gagal memuat data belanja:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBelanjaData();
  }, []);

  const getStudentTransactions = (student: StudentUser): SaveMoneyTransaction[] => {
    if (!riwayatPerSiswa) return [];
    const uId = String(student.id);
    const uNisn = String(student.nisn);
    if (riwayatPerSiswa[uId]?.length) return riwayatPerSiswa[uId];
    if (riwayatPerSiswa[uNisn]?.length) return riwayatPerSiswa[uNisn];

    for (const [, list] of Object.entries(riwayatPerSiswa)) {
      if (
        Array.isArray(list) &&
        list.some(
          (t) =>
            Number(t.user_id) === Number(student.id) ||
            (student.name && t.nama_siswa?.toLowerCase() === student.name.toLowerCase())
        )
      ) {
        return list;
      }
    }
    return [];
  };

  const getStudentBalance = (student: StudentUser | null): number => {
    if (!student) return 0;
    const txs = getStudentTransactions(student);

    // 1. Jika ada transaksi di riwayat, cek saldo_sesudah terakhir
    if (txs.length > 0) {
      const lastTx = txs[txs.length - 1];
      if (typeof lastTx.saldo_sesudah === 'number' && lastTx.saldo_sesudah >= 0) {
        return lastTx.saldo_sesudah;
      }

      // Hitung mutasi masuk - keluar
      let computed = 0;
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
        if (isOut) computed -= amt;
        else computed += amt;
      });
      return Math.max(0, computed);
    }

    // 2. Cek saldo_per_siswa dari belanjaService.init
    const rawSaldo =
      saldoPerSiswa[String(student.id)] ??
      saldoPerSiswa[String(student.nisn)] ??
      (student as any).balance ??
      (student as any).saldo ??
      0;

    // Pastikan tidak minus (>= 0)
    return Math.max(0, Number(rawSaldo) || 0);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStudentBalance = getStudentBalance(selectedStudent);
  const requiresProof = sirkulasi > 50000;
  const isInsufficient = selectedStudentBalance < sirkulasi;

  const handleOpenConfirm = () => {
    if (!selectedStudent) {
      alert('Pilih siswa terlebih dahulu.');
      return;
    }
    if (sirkulasi <= 0) {
      alert('Nominal belanja harus lebih dari Rp0.');
      return;
    }
    if (isInsufficient) {
      alert(
        `Saldo santri tidak mencukupi untuk transaksi belanja!\n\nSaldo Saat Ini: ${formatRupiah(selectedStudentBalance)}\nTotal Belanja: ${formatRupiah(sirkulasi)}\nKekurangan: ${formatRupiah(sirkulasi - selectedStudentBalance)}`
      );
      return;
    }
    if (requiresProof && !ketMoney.trim()) {
      alert('Keterangan wajib diisi untuk transaksi di atas Rp50.000.');
      return;
    }
    if (requiresProof && !invoiceFile) {
      alert('Foto bukti invoice/struk wajib diunggah untuk transaksi di atas Rp50.000.');
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleExecuteStore = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const payload: CreateBelanjaPayload = {
        user_id: selectedStudent.id,
        sirkulasi,
        tag: lockedTag || tag,
        ket_money: ketMoney || undefined,
        invoice_money: invoiceFile || undefined,
      };

      const res = await belanjaService.store(payload);

      // Kirim Notifikasi WhatsApp Otomatis ke Nomor Santri / Wali jika tersedia
      if (selectedStudent.phone) {
        try {
          const sisaBal = Math.max(0, selectedStudentBalance - sirkulasi);
          const timeStr = new Date().toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          const msg = [
            `🔔 *Pemberitahuan Transaksi Belanja Santri*`,
            ``,
            `Yth. Wali Santri dari:`,
            `👤 *Nama:* ${selectedStudent.name}`,
            `🆔 *NISN:* ${selectedStudent.nisn}`,
            ``,
            `🛍️ *Lokasi:* Stan ${(lockedTag || tag).toUpperCase()}`,
            `💰 *Nominal Belanja:* ${formatRupiah(sirkulasi)}`,
            `💳 *Sisa Saldo Tabungan:* ${formatRupiah(sisaBal)}`,
            ketMoney ? `📝 *Rincian:* ${ketMoney}` : '',
            `📅 *Waktu:* ${timeStr} WIB`,
            ``,
            `_Notifikasi otomatis Kasir Belanja Pesantren._`,
          ]
            .filter(Boolean)
            .join('\n');

          await whatsappService.sendMessage({
            phone: selectedStudent.phone,
            message: msg,
          });
        } catch (waErr) {
          console.warn('Pengiriman WhatsApp notice:', waErr);
        }
      }

      setToastMessage(res.message || 'Transaksi belanja berhasil disimpan!');
      setTimeout(() => setToastMessage(null), 5000);

      // Reset form
      setSirkulasi(0);
      setKetMoney('');
      setInvoiceFile(null);
      setConfirmModalOpen(false);

      await loadBelanjaData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi belanja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    if (editSirkulasi <= 0) {
      alert('Nominal harus lebih dari Rp0.');
      return;
    }
    if (editSirkulasi > 50000 && !editKetMoney.trim()) {
      alert('Keterangan wajib diisi jika nominal di atas Rp50.000.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await belanjaService.update(editingTx.id, {
        sirkulasi: editSirkulasi,
        ket_money: editKetMoney || undefined,
        invoice_money: editInvoiceFile || undefined,
      });

      setToastMessage(res.message || 'Transaksi berhasil diperbarui.');
      setTimeout(() => setToastMessage(null), 5000);
      setEditingTx(null);
      await loadBelanjaData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengedit transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-sm text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-700/15">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Modul Belanja & Kasir POS
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold">Kasir Belanja Santri</h1>
        <p className="text-xs sm:text-sm text-teal-100 mt-1">
          {lockedTag ? `Petugas Terkunci: Tag "${lockedTag.toUpperCase()}"` : 'Akses Admin: Seluruh Tag (Kantin & Kafe)'}
        </p>
      </div>

      {/* Main Grid: Input POS + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1: Pilih Santri */}
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-600" /> 1. Pilih Santri
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari Nama / NISN santri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredStudents.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              const studentBalance = getStudentBalance(student);
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/60 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-900">{student.name}</span>
                    <span className={`text-xs font-bold ${studentBalance === 0 ? 'text-slate-400' : 'text-teal-700'}`}>
                      {formatRupiah(studentBalance)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">NISN: {student.nisn}</p>
                </button>
              );
            })}
          </div>

          {selectedStudent && (
            <div className="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-200 text-xs space-y-1.5">
              <span className="text-[10px] text-teal-700 font-bold uppercase block tracking-wider">Santri Terpilih:</span>
              <span className="font-extrabold text-slate-900 text-sm block">{selectedStudent.name}</span>
              <div className="flex justify-between items-center text-slate-600 pt-1.5 border-t border-teal-200/60">
                <span className="font-semibold">Saldo Uang Saku:</span>
                <strong className="text-teal-800 text-sm">{formatRupiah(selectedStudentBalance)}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Kolom 2: Form POS Transaksi */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-teal-600" /> 2. Form Belanja & Menu Cepat
          </h3>

          {/* Menu Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">Pilih Cepat Menu:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MENU_PRESETS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setSirkulasi((prev) => prev + item.price);
                    setKetMoney((prev) => (prev ? `${prev}, ${item.name}` : item.name));
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 text-left hover:border-teal-500 hover:bg-teal-50/40 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-800 block leading-tight">{item.name}</span>
                  <span className="text-[11px] text-teal-600 font-semibold mt-1 block">{formatRupiah(item.price)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nominal Total Belanja (Rp)"
                type="number"
                placeholder="0"
                value={sirkulasi || ''}
                onChange={(e) => setSirkulasi(Number(e.target.value))}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tag Stan / Merchant:</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  disabled={Boolean(lockedTag)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="kantin">Kantin Utama</option>
                  <option value="kafe">Kafe Asrama</option>
                </select>
              </div>
            </div>

            {/* Preview Saldo Kasir & Estimasi Sisa */}
            {selectedStudent && sirkulasi > 0 && (
              <div
                className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                  isInsufficient
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Saldo Santri:</span>
                  <span className="font-extrabold">{formatRupiah(selectedStudentBalance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Total Belanja:</span>
                  <span className="font-bold text-rose-600">-{formatRupiah(sirkulasi)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-600">Estimasi Sisa Saldo:</span>
                  <span className={`font-extrabold ${isInsufficient ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {formatRupiah(selectedStudentBalance - sirkulasi)}
                  </span>
                </div>

                {isInsufficient && (
                  <div className="mt-1.5 p-2 bg-rose-100/90 rounded-xl border border-rose-300 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-700" />
                    <span>
                      Saldo santri tidak mencukupi untuk transaksi ini! (Kekurangan:{' '}
                      {formatRupiah(sirkulasi - selectedStudentBalance)})
                    </span>
                  </div>
                )}
              </div>
            )}

            <Input
              label={`Keterangan Belanja ${requiresProof ? '(WAJIB karena > Rp50.000)' : '(Opsional)'}`}
              placeholder="Contoh: Nasi Goreng + Es Teh"
              value={ketMoney}
              onChange={(e) => setKetMoney(e.target.value)}
            />

            {/* Upload Bukti Invoice (Wajib jika > 50k) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Foto Bukti Struk / Invoice {requiresProof && <strong className="text-rose-600">*Wajib (&gt; Rp50.000)</strong>}</span>
                {requiresProof && (
                  <span className="text-[10px] text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Nominal besar wajib foto
                  </span>
                )}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>
          </div>

          {/* Action Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <span className="text-xs text-slate-400 block">Total Potong Saldo:</span>
              <span className="text-2xl font-extrabold text-slate-900">{formatRupiah(sirkulasi)}</span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSirkulasi(0);
                  setKetMoney('');
                  setInvoiceFile(null);
                }}
                disabled={sirkulasi === 0}
              >
                Reset
              </Button>
              <Button
                variant={isInsufficient ? 'outline' : 'secondary'}
                size="md"
                leftIcon={<ShoppingBag className="w-4 h-4" />}
                onClick={handleOpenConfirm}
                disabled={sirkulasi <= 0 || !selectedStudent || isInsufficient}
                className={`flex-1 sm:flex-none ${
                  isInsufficient
                    ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                    : ''
                }`}
              >
                {isInsufficient ? 'Saldo Tidak Cukup' : 'Simpan Transaksi Belanja'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Transaksi Belanja Terbaru & Fitur Edit 3 Hari */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900">Riwayat Transaksi Belanja (3 Hari Terakhir)</h3>
            <p className="text-xs text-slate-400">Transaksi dapat diedit dalam kurun waktu 3 hari sejak dibuat.</p>
          </div>
          <Badge variant="secondary">{transactions.length} Transaksi</Badge>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">Belum ada transaksi belanja.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">Tag</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3">Bukti</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="p-3 text-slate-500 whitespace-nowrap">{tx.created_at}</td>
                    <td className="p-3 font-bold text-slate-900">{tx.user_name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.tag === 'kafe'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {tx.tag || 'kantin'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{tx.ket_money || '-'}</td>
                    <td className="p-3 font-bold text-rose-600">-{formatRupiah(tx.sirkulasi)}</td>
                    <td className="p-3">
                      {tx.invoice_money ? (
                        <a
                          href={tx.invoice_money}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Upload className="w-3 h-3" /> Foto
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTx(tx);
                          setEditSirkulasi(tx.sirkulasi);
                          setEditKetMoney(tx.ket_money || '');
                          setEditInvoiceFile(null);
                        }}
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                        title="Edit Transaksi Belanja"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal Store */}
      <ConfirmActionModal
        isOpen={confirmModalOpen}
        title="Konfirmasi Transaksi Belanja"
        description={`Simpan transaksi belanja sebesar ${formatRupiah(sirkulasi)} untuk ${selectedStudent?.name}? Saldo saku santri akan otomatis terpotong.`}
        amount={sirkulasi}
        confirmLabel="Ya, Simpan Transaksi"
        variant="secondary"
        isLoading={isSubmitting}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleExecuteStore}
      />

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Edit Transaksi Belanja #{editingTx.id}</h3>
              <button
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Siswa: <strong>{editingTx.user_name}</strong> • Tag: <strong>{editingTx.tag}</strong>
            </p>

            <form onSubmit={handleExecuteUpdate} className="space-y-3">
              <Input
                label="Nominal Baru (Rp)"
                type="number"
                value={editSirkulasi || ''}
                onChange={(e) => setEditSirkulasi(Number(e.target.value))}
              />

              <Input
                label="Keterangan Baru"
                value={editKetMoney}
                onChange={(e) => setEditKetMoney(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Bukti Baru (Opsional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditInvoiceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setEditingTx(null)}
                  type="button"
                >
                  Batal
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  isLoading={isSubmitting}
                  type="submit"
                >
                  Perbarui Transaksi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
