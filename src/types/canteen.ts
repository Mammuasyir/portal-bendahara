export type CanteenTransactionType = 'topup' | 'purchase';

export interface CanteenTransaction {
  id: string;
  studentId: string;
  type: CanteenTransactionType;
  amount: number;
  balanceAfter: number;
  timestamp: string; // ISO string or formatted Date string
  title: string;
  merchantName?: string; // e.g. "Stan Makanan Utama", "Kantin Minuman & Roti"
  referenceNo: string;
  paymentChannel?: string; // e.g. "BSI Virtual Account", "QRIS", "Kasir Kantin"
}

export interface CanteenAccount {
  studentId: string;
  studentName: string;
  grade: string;
  nis: string;
  balance: number;
  lastUpdated: string;
}

export interface TopUpPayload {
  studentId: string;
  amount: number;
  paymentChannelId: string;
}

export interface PurchasePayload {
  studentId: string;
  amount: number;
  merchantName: string;
  itemsSummary: string;
}
