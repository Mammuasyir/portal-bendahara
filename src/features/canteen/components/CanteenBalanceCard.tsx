import React from 'react';
import { CanteenAccount } from '../../../types/canteen';
import { formatRupiah } from '../../../utils/formatters';
import { Button } from '../../../components/common/Button';
import { Wallet, PlusCircle, QrCode, ArrowUpRight } from 'lucide-react';

export interface CanteenBalanceCardProps {
  account: CanteenAccount;
  onTopUpClick: () => void;
  onShowQRClick?: () => void;
  isStudent?: boolean;
}

export const CanteenBalanceCard: React.FC<CanteenBalanceCardProps> = ({
  account,
  onTopUpClick,
  onShowQRClick,
  isStudent = false,
}) => {
  return (
    <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-teal-700/15 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold text-teal-100 uppercase tracking-wider block">
                Saldo Kantin Digital
              </span>
              <span className="text-xs text-white/80 font-medium">
                {account.studentName} ({account.nis})
              </span>
            </div>
          </div>

          <span className="text-[11px] bg-emerald-500/30 text-white border border-white/20 px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
            Cashless Aktif
          </span>
        </div>

        {/* Balance Display */}
        <div className="my-5">
          <span className="text-xs text-teal-100 font-medium block mb-1">
            Saldo Tersedia Saat Ini
          </span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatRupiah(account.balance)}
            </h2>
          </div>
          <p className="text-[11px] text-teal-100/70 mt-1">
            Terakhir diperbarui: {account.lastUpdated}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/15 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={onTopUpClick}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="bg-white text-teal-800 hover:bg-teal-50 border-none shadow-md shadow-black/5 font-bold"
          >
            Top Up Saldo
          </Button>

          {onShowQRClick && (
            <Button
              variant="outline"
              onClick={onShowQRClick}
              leftIcon={<QrCode className="w-4 h-4" />}
              className="bg-white/15 hover:bg-white/25 text-white border-white/25 backdrop-blur-sm font-semibold"
            >
              {isStudent ? 'Buka QR Bayar' : 'Lihat QR Santri'}
            </Button>
          )}

          <div className="ml-auto hidden sm:flex items-center gap-1 text-xs text-teal-100 font-medium">
            <span>Bebas uang tunai di asrama</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
