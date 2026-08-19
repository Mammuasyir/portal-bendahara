export type UserRole = 'parent' | 'student' | 'admin' | 'canteen_staff';

export type TransactionType = 'in' | 'out';

export type PaymentStatus = 'lunas' | 'belum_bayar' | 'jatuh_tempo';

export interface BaseResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
