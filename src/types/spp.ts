export type SPPStatus = 'lunas' | 'belum_bayar' | 'jatuh_tempo';

export interface WANotificationInfo {
  isSent: boolean;
  sentAt?: string; // e.g. "2026-08-01 08:30"
  recipientPhone: string;
  templateName: string;
}

export interface SPPBill {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  month: string; // e.g. "Agustus"
  year: number; // e.g. 2026
  academicYear: string; // e.g. "2026/2027"
  amount: number;
  dueDate: string; // e.g. "2026-08-10"
  status: SPPStatus;
  waNotification: WANotificationInfo;
  paidAt?: string;
  paymentMethod?: string;
  transactionRef?: string;
}

export interface PaymentChannel {
  id: string;
  name: string;
  category: 'Virtual Account' | 'QRIS' | 'Bank Transfer';
  fee: number;
  accountNumber?: string;
}

export interface PaySPPPayload {
  billId: string;
  paymentChannelId: string;
}
