/**
 * Validasi nominal top-up saldo kantin.
 * Aturan: Minimal Rp50.000
 */
export const MIN_TOPUP_AMOUNT = 50000;

export const validateTopUpAmount = (amount: number): { isValid: boolean; message?: string } => {
  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, message: 'Masukkan nominal top-up yang valid' };
  }
  if (amount < MIN_TOPUP_AMOUNT) {
    return { isValid: false, message: `Nominal top-up minimal Rp50.000` };
  }
  return { isValid: true };
};

/**
 * Validasi kecukupan saldo kantin untuk transaksi belanja.
 * Aturan: Saldo tidak boleh minus (currentBalance >= spendAmount)
 */
export const validateSufficientBalance = (
  currentBalance: number,
  spendAmount: number
): { isValid: boolean; message?: string } => {
  if (spendAmount <= 0) {
    return { isValid: false, message: 'Nominal transaksi harus lebih dari 0' };
  }
  if (currentBalance < spendAmount) {
    return { isValid: false, message: 'Saldo kantin tidak mencukupi untuk transaksi ini' };
  }
  return { isValid: true };
};
