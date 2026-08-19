import { MOCK_EXPENSES } from '../data/mockExpenses';
import { SchoolExpense, CreateExpensePayload, ExpenseCategory } from '../types/expense';
import { apiClient } from './apiClient';
import { IS_LIVE } from '../config/env';

// In-memory state copy for interactive fallback
let expensesState: SchoolExpense[] = [...MOCK_EXPENSES];

export interface ExpenseFilters {
  category?: ExpenseCategory | 'ALL';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export const expenseService = {
  /**
   * Mengambil daftar pengeluaran sekolah dengan filter.
   * Terintegrasi dengan backend /api/staff/belanja/recent dan /api/staff/belanja/init.
   */
  async getExpenses(filters?: ExpenseFilters): Promise<SchoolExpense[]> {
    if (IS_LIVE) {
      try {
        const response = await apiClient.get('/api/staff/belanja/recent');
        const rawList = response.data || response.transactions || response.items || (Array.isArray(response) ? response : []);
        
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped: SchoolExpense[] = rawList.map((item: any) => ({
            id: String(item.id || `exp-${Math.random()}`),
            title: item.title || item.keterangan || item.name || 'Pengeluaran Sekolah',
            amount: Number(item.amount || item.nominal || item.total || 0),
            category: (item.category || item.kategori || 'Operasional') as ExpenseCategory,
            date: item.date || item.tanggal || new Date().toISOString().split('T')[0],
            description: item.description || item.catatan || '',
            createdByName: item.created_by || item.staff_name || 'Staff Keuangan',
            receiptNumber: item.receipt_no || item.no_kwitansi || `KWT-${item.id || Date.now()}`,
          }));

          let result = mapped;
          if (filters) {
            if (filters.category && filters.category !== 'ALL') {
              result = result.filter((exp) => exp.category === filters.category);
            }
            if (filters.startDate) {
              result = result.filter((exp) => exp.date >= filters.startDate!);
            }
            if (filters.endDate) {
              result = result.filter((exp) => exp.date <= filters.endDate!);
            }
            if (filters.searchQuery) {
              const q = filters.searchQuery.toLowerCase();
              result = result.filter(
                (exp) =>
                  exp.title.toLowerCase().includes(q) ||
                  exp.category.toLowerCase().includes(q) ||
                  exp.description?.toLowerCase().includes(q)
              );
            }
          }
          return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      } catch (err) {
        console.warn('Live API /api/staff/belanja/recent fallback to local cache:', err);
      }
    }

    // Fallback Mock State
    await new Promise((resolve) => setTimeout(resolve, 200));
    let result = [...expensesState];

    if (filters) {
      if (filters.category && filters.category !== 'ALL') {
        result = result.filter((exp) => exp.category === filters.category);
      }
      if (filters.startDate) {
        result = result.filter((exp) => exp.date >= filters.startDate!);
      }
      if (filters.endDate) {
        result = result.filter((exp) => exp.date <= filters.endDate!);
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        result = result.filter(
          (exp) =>
            exp.title.toLowerCase().includes(q) ||
            exp.category.toLowerCase().includes(q) ||
            exp.description?.toLowerCase().includes(q)
        );
      }
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /**
   * Menambahkan pencatatan pengeluaran kas sekolah baru.
   * Terintegrasi dengan backend /api/staff/belanja/store.
   */
  async createExpense(payload: CreateExpensePayload, authorName: string = 'Ustadzah Sarah (TU)'): Promise<SchoolExpense> {
    if (IS_LIVE) {
      try {
        const response = await apiClient.post('/api/staff/belanja/store', {
          title: payload.title,
          amount: payload.amount,
          category: payload.category,
          date: payload.date,
          description: payload.description,
        });

        const createdData = response.data || response;
        const newExpense: SchoolExpense = {
          id: String(createdData.id || `exp-${Date.now()}`),
          title: createdData.title || payload.title,
          amount: Number(createdData.amount || payload.amount),
          category: (createdData.category || payload.category) as ExpenseCategory,
          date: createdData.date || payload.date,
          description: createdData.description || payload.description,
          createdByName: authorName,
          receiptNumber: createdData.receipt_number || `KWT-EXP-${Date.now().toString().slice(-6)}`,
        };
        expensesState.unshift(newExpense);
        return newExpense;
      } catch (err) {
        console.warn('Live API /api/staff/belanja/store fallback to local storage:', err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
    const newExpense: SchoolExpense = {
      id: `exp-${Date.now()}`,
      title: payload.title,
      amount: payload.amount,
      category: payload.category,
      date: payload.date,
      description: payload.description,
      createdByName: authorName,
      receiptNumber: `KWT-EXP-${Date.now().toString().slice(-6)}`,
    };

    expensesState.unshift(newExpense);
    return newExpense;
  },

  /**
   * Menghapus catatan pengeluaran
   */
  async deleteExpense(id: string): Promise<boolean> {
    expensesState = expensesState.filter((exp) => exp.id !== id);
    return true;
  },

  /**
   * Mengambil ringkasan total pengeluaran per kategori.
   * Terintegrasi dengan backend /api/staff/belanja/stats.
   */
  async getExpenseSummary(): Promise<{ total: number; byCategory: Record<ExpenseCategory, number> }> {
    if (IS_LIVE) {
      try {
        const response = await apiClient.get('/api/staff/belanja/stats');
        if (response && (response.total !== undefined || response.data)) {
          const stats = response.data || response;
          return {
            total: Number(stats.total || stats.total_pengeluaran || 0),
            byCategory: {
              Operasional: Number(stats.byCategory?.Operasional || stats.operasional || 0),
              Gaji: Number(stats.byCategory?.Gaji || stats.gaji || 0),
              Sarana: Number(stats.byCategory?.Sarana || stats.sarana || 0),
              Konsumsi: Number(stats.byCategory?.Konsumsi || stats.konsumsi || 0),
              'Lain-lain': Number(stats.byCategory?.['Lain-lain'] || stats.lain_lain || 0),
            },
          };
        }
      } catch (err) {
        console.warn('Live API /api/staff/belanja/stats fallback to calculated summary:', err);
      }
    }

    const byCategory: Record<ExpenseCategory, number> = {
      Operasional: 0,
      Gaji: 0,
      Sarana: 0,
      Konsumsi: 0,
      'Lain-lain': 0,
    };

    let total = 0;
    expensesState.forEach((exp) => {
      total += exp.amount;
      if (byCategory[exp.category] !== undefined) {
        byCategory[exp.category] += exp.amount;
      }
    });

    return { total, byCategory };
  },
};
