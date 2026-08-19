import React, { useState, useEffect } from 'react';
import { tabunganService } from '../../services/tabunganService';
import { StudentUser, SaveMoneyTransaction } from '../../types/backend';
import { formatRupiah } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TagBadge } from '../tabungan/TabunganPage';
import {
  History,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  GraduationCap,
} from 'lucide-react';

export const RiwayatPage: React.FC = () => {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [selectedNisn, setSelectedNisn] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [historyList, setHistoryList] = useState<SaveMoneyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [_isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Load initial student list
  useEffect(() => {
    const loadInit = async () => {
      try {
        const res = await tabunganService.init();
        setStudents(res.users || []);
        if (res.users?.length > 0) {
          setSelectedNisn(res.users[0].nisn);
          setSelectedStudent(res.users[0]);
          fetchHistory(res.users[0].nisn);
        }
      } catch (err) {
        console.warn('Gagal memuat daftar siswa untuk riwayat:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInit();
  }, []);

  const fetchHistory = async (nisn: string) => {
    if (!nisn) return;
    setIsLoading(true);
    try {
      const res = await tabunganService.getHistory(nisn);
      const allTx: SaveMoneyTransaction[] = [];
      Object.values(res.riwayat_per_siswa || {}).forEach((txArr) => {
        allTx.push(...txArr);
      });
      // Sort newest first
      allTx.sort((a, b) => new Date(b.tanggal_transaksi).getTime() - new Date(a.tanggal_transaksi).getTime());
      setHistoryList(allTx);
    } catch (err) {
      console.warn('Gagal mengambil riwayat mutasi NISN:', err);
      setHistoryList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudent = (student: StudentUser) => {
    setSelectedNisn(student.nisn);
    setSelectedStudent(student);
    fetchHistory(student.nisn);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNisn.trim()) return;
    const found = students.find((s) => s.nisn === selectedNisn.trim());
    if (found) {
      setSelectedStudent(found);
    } else {
      setSelectedStudent({ id: 0, name: `Santri (${selectedNisn})`, nisn: selectedNisn });
    }
    fetchHistory(selectedNisn.trim());
  };

  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');

  const filteredHistoryList = historyList.filter((tx) => {
    if (selectedTagFilter === 'ALL') return true;
    return tx.tag === selectedTagFilter;
  });

  const latestSaldo = historyList.length > 0 ? historyList[0].saldo_sesudah : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/15">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Buku Mutasi Keuangan Santri
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold">Riwayat Transaksi per Santri (NISN)</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Laporan kronologis saldo awal, mutasi tabungan/belanja, dan saldo akhir berjalan.
        </p>
      </div>

      {/* Selector & Search Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih dari Daftar Santri:
            </label>
            <select
              value={selectedNisn}
              onChange={(e) => {
                const found = students.find((s) => s.nisn === e.target.value);
                if (found) handleSelectStudent(found);
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.nisn}>
                  {s.name} (NISN: {s.nisn})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Atau Cari Nomor NISN:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Masukkan NISN..."
                value={selectedNisn}
                onChange={(e) => setSelectedNisn(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
            Cari Riwayat
          </Button>
        </form>
      </div>

      {/* Selected Student Info & Running Balance */}
      {selectedStudent && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selectedStudent.name}</h2>
              <p className="text-xs text-slate-500">NISN: {selectedStudent.nisn}</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-right w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Saldo Akhir Berjalan
            </span>
            <span className="text-2xl font-extrabold text-emerald-900 tracking-tight block">
              {formatRupiah(latestSaldo)}
            </span>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Kronologi Mutasi Saldo</h3>
            <p className="text-xs text-slate-400">Filter berdasarkan tag atau lihat semua mutasi</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'Semua Tag' },
              { id: 'uang_saku', label: 'Uang Saku' },
              { id: 'spp', label: 'SPP' },
              { id: 'kantin', label: 'Kantin' },
              { id: 'kafe', label: 'Kafe' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedTagFilter(f.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedTagFilter === f.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <Badge variant="neutral">{filteredHistoryList.length} Transaksi</Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Memuat riwayat mutasi...</div>
        ) : filteredHistoryList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {selectedTagFilter === 'ALL'
              ? 'Belum ada riwayat transaksi untuk NISN ini.'
              : `Tidak ada transaksi dengan tag "${selectedTagFilter}".`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Waktu Transaksi</th>
                  <th className="p-3">Jenis Mutasi</th>
                  <th className="p-3">Tag Dana</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3">Saldo Sebelum</th>
                  <th className="p-3">Nominal Transaksi</th>
                  <th className="p-3 text-right">Saldo Sesudah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistoryList.map((tx, idx) => {
                  const isIn = tx.jenis_transaksi?.includes('+');
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-3 text-slate-500 whitespace-nowrap">{tx.tanggal_transaksi}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isIn ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {tx.jenis_transaksi}
                        </span>
                      </td>
                      <td className="p-3">
                        <TagBadge tag={tx.tag} />
                        {!tx.tag && <span className="text-slate-400 text-[11px]">—</span>}
                      </td>
                      <td className="p-3 text-slate-700">
                        {tx.keterangan || (isIn ? 'Setoran Dana' : 'Belanja / Penarikan')}
                      </td>
                      <td className="p-3 text-slate-500">{formatRupiah(tx.saldo_sebelum)}</td>
                      <td className={`p-3 font-bold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIn ? '+' : '-'}{formatRupiah(tx.jumlah)}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 text-right">
                        {formatRupiah(tx.saldo_sesudah)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
