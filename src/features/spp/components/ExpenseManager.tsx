import React, { useState, useEffect } from 'react';
import { SchoolExpense, ExpenseCategory, CreateExpensePayload } from '../../../types/expense';
import { EXPENSE_CATEGORIES } from '../../../data/mockExpenses';
import { expenseService } from '../../../services/expenseService';
import { formatRupiah } from '../../../utils/formatters';
import { TransactionCard } from '../../../components/cards/TransactionCard';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { ConfirmActionModal } from '../../../components/common/ConfirmActionModal';
import { 
  Plus, 
  TrendingDown, 
  Search, 
  Trash2,
  Receipt
} from 'lucide-react';

export const ExpenseManager: React.FC = () => {
  const [expenses, setExpenses] = useState<SchoolExpense[]>([]);
  const [summary, setSummary] = useState<{ total: number; byCategory: Record<ExpenseCategory, number> }>({
    total: 0,
    byCategory: { Operasional: 0, Gaji: 0, Sarana: 0, Konsumsi: 0, 'Lain-lain': 0 },
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Operasional');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDesc, setFormDesc] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [expenseToDelete, setExpenseToDelete] = useState<SchoolExpense | null>(null);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const [list, sum] = await Promise.all([
        expenseService.getExpenses({
          category: selectedCategory,
          searchQuery: searchQuery,
        }),
        expenseService.getExpenseSummary(),
      ]);
      setExpenses(list);
      setSummary(sum);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory, searchQuery]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const numericAmount = Number(formAmount);
    if (!formTitle.trim()) {
      setFormError('Nama/judul pengeluaran wajib diisi.');
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Nominal pengeluaran harus berupa angka valid lebih dari 0.');
      return;
    }
    if (!formDate) {
      setFormError('Tanggal transaksi wajib dipilih.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteCreateExpense = async () => {
    setIsSubmitting(true);
    try {
      const payload: CreateExpensePayload = {
        title: formTitle,
        amount: Number(formAmount),
        category: formCategory,
        date: formDate,
        description: formDesc,
      };
      await expenseService.createExpense(payload);
      setShowConfirmModal(false);
      setIsFormOpen(false);
      // Reset form
      setFormTitle('');
      setFormAmount('');
      setFormDesc('');
      await loadExpenses();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await expenseService.deleteExpense(id);
    setExpenseToDelete(null);
    await loadExpenses();
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pencatatan Pengeluaran Kas Sekolah</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buku kas operasional, belanja sarana, gaji ustadz & logistik santri
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsFormOpen(true)}
          className="self-start sm:self-auto"
        >
          Catat Pengeluaran Baru
        </Button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl p-5 text-white shadow-md shadow-rose-600/15 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-rose-200" />
            <span className="text-xs text-rose-100 font-medium">Total Seluruh Pengeluaran</span>
          </div>
          <span className="text-2xl font-extrabold tracking-tight block">
            {formatRupiah(summary.total)}
          </span>
          <span className="text-[11px] text-rose-200 mt-1 block">
            Terbagi dalam 5 kategori operasional
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm sm:col-span-2 flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
            Rincian per Kategori
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {EXPENSE_CATEGORIES.map((cat) => (
              <div key={cat} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block truncate">{cat}</span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {formatRupiah(summary.byCategory[cat] || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari pengeluaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expense Items List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Memuat data pengeluaran...</div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
          <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Tidak ada catatan pengeluaran</p>
          <p className="text-xs text-slate-400">Silakan ubah filter atau tambahkan pengeluaran baru.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {expenses.map((exp) => (
            <div key={exp.id} className="relative group">
              <TransactionCard
                title={exp.title}
                subtitle={`${exp.createdByName} • ${exp.description || 'Tanpa keterangan'}`}
                amount={exp.amount}
                type="out"
                date={exp.date}
                categoryTag={exp.category}
                iconType="expense"
              />
              <button
                onClick={() => setExpenseToDelete(exp)}
                title="Hapus Catatan"
                className="absolute right-3 top-3 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Input Pengeluaran Baru */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-10 border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Catat Pengeluaran Kas Sekolah</h3>
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {formError}
              </div>
            )}
            <form onSubmit={handleOpenConfirm} className="space-y-3.5">
              <Input
                label="Nama / Keperluan Pengeluaran"
                placeholder="contoh: Pembelian Logistik Dapur Asrama"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />

              <Input
                label="Nominal Pengeluaran"
                leftPrefix="Rp"
                type="number"
                placeholder="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kategori Pengeluaran
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                  className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Pengeluaran
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-sm py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Keterangan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Catatan kwitansi atau rincian..."
                  className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" fullWidth onClick={() => setIsFormOpen(false)}>
                  Batal
                </Button>
                <Button variant="primary" fullWidth type="submit">
                  Lanjutkan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pengeluaran */}
      <ConfirmActionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecuteCreateExpense}
        isLoading={isSubmitting}
        title="Konfirmasi Pencatatan Pengeluaran"
        description="Periksa kembali rincian pengeluaran kas sekolah."
        amount={Number(formAmount)}
        amountLabel="Nominal Pengeluaran"
        variant="danger"
        iconType="warning"
        details={[
          { label: 'Keperluan', value: formTitle },
          { label: 'Kategori', value: formCategory },
          { label: 'Tanggal', value: formDate },
          { label: 'Petugas TU', value: 'Ustadzah Sarah (TU)' },
        ]}
        confirmLabel="Ya, Simpan ke Buku Kas"
        cancelLabel="Koreksi Data"
      />

      {/* Modal Hapus Pengeluaran */}
      {expenseToDelete && (
        <ConfirmActionModal
          isOpen={!!expenseToDelete}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={() => handleDeleteExpense(expenseToDelete.id)}
          title="Hapus Catatan Pengeluaran"
          description="Apakah Anda yakin ingin menghapus data pengeluaran ini dari pembukuan?"
          amount={expenseToDelete.amount}
          amountLabel="Nominal Dihapus"
          variant="danger"
          details={[
            { label: 'Judul', value: expenseToDelete.title },
            { label: 'Kategori', value: expenseToDelete.category },
            { label: 'Tanggal', value: expenseToDelete.date },
          ]}
          confirmLabel="Hapus Data"
          cancelLabel="Batal"
        />
      )}
    </div>
  );
};
