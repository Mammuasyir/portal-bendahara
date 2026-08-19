export type ExpenseCategory = 
  | 'Operasional' 
  | 'Gaji' 
  | 'Sarana' 
  | 'Konsumsi' 
  | 'Lain-lain';

export interface SchoolExpense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // "YYYY-MM-DD"
  description?: string;
  createdByName: string;
  receiptNumber?: string;
}

export interface CreateExpensePayload {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  description?: string;
}
