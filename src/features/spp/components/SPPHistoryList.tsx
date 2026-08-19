import React, { useState } from 'react';
import { SPPBill } from '../../../types/spp';
import { TransactionCard } from '../../../components/cards/TransactionCard';
import { Filter, Receipt } from 'lucide-react';

export interface SPPHistoryListProps {
  bills: SPPBill[];
  onBillClick?: (bill: SPPBill) => void;
}

export const SPPHistoryList: React.FC<SPPHistoryListProps> = ({
  bills,
  onBillClick,
}) => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const academicYears = Array.from(new Set(bills.map((b) => b.academicYear)));

  const filteredBills = bills.filter((bill) => {
    if (selectedAcademicYear !== 'ALL' && bill.academicYear !== selectedAcademicYear) {
      return false;
    }
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'lunas' && bill.status !== 'lunas') return false;
      if (selectedStatus === 'unpaid' && bill.status === 'lunas') return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-primary-600" />
          <span>Filter Riwayat:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Tahun Ajaran */}
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Semua Tahun Ajaran</option>
            {academicYears.map((ay) => (
              <option key={ay} value={ay}>
                TA {ay}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Semua Status</option>
            <option value="lunas">Hanya Lunas</option>
            <option value="unpaid">Belum Lunas</option>
          </select>
        </div>
      </div>

      {/* List of Transaction Cards */}
      {filteredBills.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Tidak ada riwayat tagihan SPP</p>
          <p className="text-xs text-slate-500">
            Coba sesuaikan filter tahun ajaran atau status pembayaran.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredBills.map((bill) => {
            const statusConfig = {
              lunas: { label: 'Lunas', variant: 'success' as const },
              belum_bayar: { label: 'Belum Bayar', variant: 'warning' as const },
              jatuh_tempo: { label: 'Jatuh Tempo', variant: 'danger' as const },
            };

            return (
              <TransactionCard
                key={bill.id}
                title={`SPP ${bill.month} ${bill.year}`}
                subtitle={`${bill.studentName} (TA ${bill.academicYear})`}
                amount={bill.amount}
                type="neutral"
                date={bill.paidAt || bill.dueDate}
                iconType="spp"
                statusBadge={statusConfig[bill.status]}
                categoryTag={bill.paymentMethod || 'Menunggu Pembayaran'}
                onClick={onBillClick ? () => onBillClick(bill) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
