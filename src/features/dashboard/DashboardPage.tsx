import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { belanjaService } from '../../services/belanjaService';
import { BelanjaStatsResponse, BelanjaTransaction } from '../../types/backend';
import { formatRupiah } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  TrendingUp,
  ShoppingBag,
  Coffee,
  Users,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

export interface DashboardPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { user, roleLabel, isAdmin } = useAuth();
  const [stats, setStats] = useState<BelanjaStatsResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<BelanjaTransaction[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, recentRes, initRes] = await Promise.all([
        belanjaService.getStats(),
        belanjaService.getRecent(),
        belanjaService.init(),
      ]);

      setStats(statsRes);
      setRecentTransactions(recentRes.transactions || []);
      setTotalStudents(initRes.users?.length || 0);
    } catch (err) {
      console.warn('Gagal memuat statistik dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalKantin = stats?.per_tag?.kantin?.total || 0;
  const countKantin = stats?.per_tag?.kantin?.count || 0;
  const totalKafe = stats?.per_tag?.kafe?.total || 0;
  const countKafe = stats?.per_tag?.kafe?.count || 0;
  const grandTotal = stats?.grand_total || 0;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-700/15 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Sesi {roleLabel} Aktif
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Assalamu'alaikum, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-xl">
            Sistem Informasi Keuangan Santri IDN • Manajemen Belanja Kantin, Kafe, dan Tabungan Santri.
          </p>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
        {isAdmin && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-violet-400 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-violet-600 mb-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Modul SPP</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Dashboard SPP</h3>
              <p className="text-xs text-slate-500 mt-1">
                Monitoring kas masuk SPP (Rp4jt/bln), pelacakan tunggakan santri per kelas, dan status kelancaran.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateTab?.('rekap-spp')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Buka Dashboard SPP
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-teal-400 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-teal-600 mb-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Modul Belanja (POS)</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Kasir Belanja Santri</h3>
            <p className="text-xs text-slate-500 mt-1">
              Catat transaksi jajan santri di kantin / kafe dengan pemotongan saldo instan.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigateTab?.('belanja')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Buka Kasir Belanja
            </Button>
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Modul Tabungan</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Setor & Tarik Tabungan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kelola setoran uang saku santri per kelas (7A–9A) dan penarikan saku.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateTab?.('tabungan')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Buka Tabungan Santri
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Riwayat Mutasi</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Riwayat per NISN</h3>
              <p className="text-xs text-slate-500 mt-1">
                Cek riwayat transaksi jajan santri dan mutasi saldo santri berdasarkan NISN.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigateTab?.('riwayat')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Buka Riwayat Transaksi
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Macro Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Grand Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Belanja</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
            {formatRupiah(grandTotal)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1">Akumulasi belanja bulan ini</span>
        </div>

        {/* Kantin */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Stan Kantin</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
            {formatRupiah(totalKantin)}
          </p>
          <span className="text-[11px] text-teal-600 font-semibold mt-1">{countKantin} Transaksi</span>
        </div>

        {/* Kafe */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Stan Kafe</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
            {formatRupiah(totalKafe)}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold mt-1">{countKafe} Transaksi</span>
        </div>

        {/* Santri */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Santri Terdaftar</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
            {totalStudents} Santri
          </p>
          <span className="text-[11px] text-blue-600 font-semibold mt-1">Kelas 7A – 9A</span>
        </div>
      </div>

      {/* Daily Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Breakdown */}
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Breakdown per Tag</h3>
            <button
              onClick={loadDashboardData}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-teal-800">Kantin Utama</span>
                <Badge variant="secondary" size="sm">{countKantin} TRX</Badge>
              </div>
              <span className="text-base font-extrabold text-slate-900 block">{formatRupiah(totalKantin)}</span>
              <span className="text-[10px] text-slate-500">Rata-rata: {formatRupiah(stats?.per_tag?.kantin?.avg || 0)}/trx</span>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-amber-800">Kafe Asrama</span>
                <Badge variant="warning" size="sm">{countKafe} TRX</Badge>
              </div>
              <span className="text-base font-extrabold text-slate-900 block">{formatRupiah(totalKafe)}</span>
              <span className="text-[10px] text-slate-500">Rata-rata: {formatRupiah(stats?.per_tag?.kafe?.avg || 0)}/trx</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions Stream */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transaksi Belanja Terbaru</h3>
              <p className="text-[11px] text-slate-400">3 hari terakhir dari server</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab?.('belanja')}
            >
              Lihat Semua
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Memuat transaksi terbaru...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">Belum ada transaksi belanja terbaru.</div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        tx.tag === 'kafe'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {tx.tag === 'kafe' ? <Coffee className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {tx.user_name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {tx.ket_money || (tx.tag === 'kafe' ? 'Belanja Kafe' : 'Belanja Kantin')} •{' '}
                        <span className="capitalize font-semibold text-slate-700">{tx.tag || 'kantin'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-600 block">
                      -{formatRupiah(tx.sirkulasi)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" /> {tx.created_at}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
