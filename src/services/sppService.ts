// TODO: replace with real API endpoints: /api/v1/spp/bills, /api/v1/spp/pay
import { MOCK_SPP_BILLS, MOCK_PAYMENT_CHANNELS } from '../data/mockSPP';
import { SPPBill, PaymentChannel, PaySPPPayload } from '../types/spp';

// In-memory state copy for interactive demo manipulation
let sppBillsState: SPPBill[] = [...MOCK_SPP_BILLS];

export const sppService = {
  /**
   * Mengambil seluruh tagihan untuk satu siswa tertentu
   */
  async getBillsByStudentId(studentId: string): Promise<SPPBill[]> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return sppBillsState.filter((b) => b.studentId === studentId);
  },

  /**
   * Mengambil semua tagihan SPP untuk rekapitulasi Admin/TU
   */
  async getAllBills(): Promise<SPPBill[]> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return [...sppBillsState];
  },

  /**
   * Mengambil daftar metode pembayaran yang didukung
   */
  async getPaymentChannels(): Promise<PaymentChannel[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return [...MOCK_PAYMENT_CHANNELS];
  },

  /**
   * Memproses pembayaran tagihan SPP (Simulasi Gateway)
   */
  async payBill(payload: PaySPPPayload): Promise<SPPBill> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const billIndex = sppBillsState.findIndex((b) => b.id === payload.billId);
    if (billIndex === -1) {
      throw new Error('Tagihan SPP tidak ditemukan.');
    }

    const channel = MOCK_PAYMENT_CHANNELS.find((c) => c.id === payload.paymentChannelId);
    const channelName = channel ? channel.name : 'Virtual Account Gateway';

    const now = new Date();
    const formattedPaidAt = `${now.toLocaleDateString('id-ID')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;

    const updatedBill: SPPBill = {
      ...sppBillsState[billIndex],
      status: 'lunas',
      paidAt: formattedPaidAt,
      paymentMethod: channelName,
      transactionRef: `TRX-SPP-PAY-${Date.now().toString().slice(-6)}`,
      waNotification: {
        isSent: true,
        sentAt: `${formattedPaidAt} (Kwitansi Digital Terkirim)`,
        recipientPhone: sppBillsState[billIndex].waNotification.recipientPhone,
        templateName: 'Kwitansi_Pembayaran_Lunas',
      },
    };

    sppBillsState[billIndex] = updatedBill;
    return updatedBill;
  },

  /**
   * Reset data mock ke kondisi awal
   */
  resetState(): void {
    sppBillsState = [...MOCK_SPP_BILLS];
  },
};
