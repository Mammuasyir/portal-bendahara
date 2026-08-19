import React, { useState } from 'react';
import { CanteenTransaction } from '../../../types/canteen';
import { TransactionCard } from '../../../components/cards/TransactionCard';
import { Filter, Utensils } from 'lucide-react';

export interface CanteenMutationListProps {
  transactions: CanteenTransaction[];
}

export const CanteenMutationList: React.FC<CanteenMutationListProps> = ({
  transactions,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'topup' | 'purchase'>('ALL');

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-teal-600" />
          <span>Filter Riwayat Mutasi:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('topup')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
              filterType === 'topup'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Top Up (+)
          </button>
          <button
            onClick={() => setFilterType('purchase')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
              filterType === 'purchase'
                ? 'bg-rose-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Jajan (-)
          </button>
        </div>
      </div>

      {/* List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
          <Utensils className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Belum ada riwayat transaksi</p>
          <p className="text-xs text-slate-400">Seluruh mutasi belanja dan top up akan tercatat otomatis di sini.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              title={tx.title}
              subtitle={`${tx.merchantName || 'Kantin Asrama'} • Ref: ${tx.referenceNo}`}
              amount={tx.amount}
              type={tx.type === 'topup' ? 'in' : 'out'}
              date={tx.timestamp}
              iconType={tx.type === 'topup' ? 'topup' : 'canteen'}
              statusBadge={{
                label: tx.type === 'topup' ? 'Top Up' : 'Belanja',
                variant: tx.type === 'topup' ? 'success' : 'danger',
              }}
              categoryTag={tx.paymentChannel}
            />
          ))}
        </div>
      )}
    </div>
  );
};
