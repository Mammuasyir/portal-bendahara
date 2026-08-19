/**
 * Utility untuk memformat angka menjadi format mata uang Rupiah standar.
 * Contoh: 1000000 -> "Rp1.000.000"
 */
export const formatRupiah = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rp0';
  }
  
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // Normalisasi spasi dan non-breaking space ("Rp 1.000.000" -> "Rp1.000.000")
  return formatted.replace(/\s+/g, '').replace(/\u00a0/g, '');
};

/**
 * Utility untuk memformat tanggal ke dalam format standar Indonesia.
 * short: "12/08/2026"
 * long: "12 Agustus 2026"
 */
export const formatDate = (
  dateInput: string | Date | number,
  style: 'short' | 'long' = 'short'
): string => {
  if (!dateInput) return '-';
  
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' 
    ? new Date(dateInput) 
    : dateInput;
    
  if (isNaN(date.getTime())) {
    return String(dateInput);
  }

  if (style === 'long') {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};
