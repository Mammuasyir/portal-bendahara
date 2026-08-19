import { apiClient } from './apiClient';

export interface SendWhatsAppPayload {
  phone: string;
  message: string;
}

export interface SendWhatsAppResponse {
  success: boolean;
  message: string;
  sent_to?: string;
}

export const whatsappService = {
  /**
   * Mengirim pesan WhatsApp ke nomor telepon santri / wali santri via Evolution API
   * POST /api/staff/whatsapp/send
   */
  async sendMessage(payload: SendWhatsAppPayload): Promise<SendWhatsAppResponse> {
    if (!payload.phone || !payload.message) {
      return { success: false, message: 'Nomor telepon dan pesan wajib diisi.' };
    }

    try {
      return await apiClient.post<SendWhatsAppResponse>(
        '/api/staff/whatsapp/send',
        payload
      );
    } catch (err: any) {
      console.warn('Gagal mengirim WhatsApp otomatis (notifikasi dilewati):', err);
      return {
        success: false,
        message: err.message || 'Gagal mengirim pesan WhatsApp.',
      };
    }
  },

  /**
   * Template pesan WA untuk Setoran Uang Saku (+)
   */
  formatSetorUangSaku(
    studentName: string,
    nisn: string,
    nominal: string,
    saldoAkhir: string,
    keterangan?: string
  ): string {
    const timeStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      `🔔 *Pemberitahuan Setoran Uang Saku Santri*`,
      ``,
      `Yth. Wali Santri dari:`,
      `👤 *Nama:* ${studentName}`,
      `🆔 *NISN:* ${nisn}`,
      ``,
      `💵 *Jenis Transaksi:* Setoran Uang Saku (+)`,
      `💰 *Nominal:* ${nominal}`,
      `💳 *Total Saldo Tabungan:* ${saldoAkhir}`,
      keterangan ? `📝 *Keterangan:* ${keterangan}` : '',
      `📅 *Waktu:* ${timeStr} WIB`,
      ``,
      `_Pesan otomatis dari Layanan Keuangan Pesantren._`,
    ]
      .filter(Boolean)
      .join('\n');
  },

  /**
   * Template pesan WA untuk Penarikan Uang Saku (-)
   */
  formatTarikUangSaku(
    studentName: string,
    nisn: string,
    nominal: string,
    saldoAkhir: string,
    keterangan?: string
  ): string {
    const timeStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      `🔔 *Pemberitahuan Penarikan Uang Saku Santri*`,
      ``,
      `Yth. Wali Santri dari:`,
      `👤 *Nama:* ${studentName}`,
      `🆔 *NISN:* ${nisn}`,
      ``,
      `💵 *Jenis Transaksi:* Penarikan Uang Saku (-)`,
      `💰 *Nominal Penarikan:* ${nominal}`,
      `💳 *Sisa Saldo Tabungan:* ${saldoAkhir}`,
      keterangan ? `📝 *Keterangan:* ${keterangan}` : '',
      `📅 *Waktu:* ${timeStr} WIB`,
      ``,
      `_Pesan otomatis dari Layanan Keuangan Pesantren._`,
    ]
      .filter(Boolean)
      .join('\n');
  },

  /**
   * Template pesan WA untuk Pelunasan SPP Bulanan
   */
  formatPotongSPP(
    studentName: string,
    nisn: string,
    bulan: string,
    nominal: string,
    sisaSaldo: string,
    keterangan?: string
  ): string {
    const timeStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      `✅ *Konfirmasi Pembayaran SPP Santri*`,
      ``,
      `Yth. Wali Santri dari:`,
      `👤 *Nama Santri:* ${studentName}`,
      `🆔 *NISN:* ${nisn}`,
      ``,
      `📌 *Tagihan:* SPP Bulan ${bulan}`,
      `💰 *Nominal:* ${nominal}`,
      `💵 *Metode Pembayaran:* Pemotongan Saldo Tabungan`,
      `💳 *Sisa Saldo Tabungan:* ${sisaSaldo}`,
      keterangan ? `📝 *Catatan:* ${keterangan}` : '',
      `📅 *Waktu:* ${timeStr} WIB`,
      `🟢 *Status Tagihan:* LUNAS (Berhasil)`,
      ``,
      `_Jazakumullah Khairan atas pembayaran SPP santri._`,
    ]
      .filter(Boolean)
      .join('\n');
  },
};
