import { apiClient } from './apiClient';
import {
  SaveMoneyInitResponse,
  SaveMoneyTransaction,
  CreateSaveMoneyPayload,
} from '../types/backend';

export const tabunganService = {
  /**
   * GET /api/staff/save-money/init
   * Inisialisasi halaman tabungan: class_buttons + users + riwayat_per_siswa
   */
  async init(params?: { thang?: string; nisn?: string }): Promise<SaveMoneyInitResponse> {
    const searchParams = new URLSearchParams();
    if (params?.thang) searchParams.append('thang', params.thang);
    if (params?.nisn) searchParams.append('nisn', params.nisn);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<SaveMoneyInitResponse>(`/api/staff/save-money/init${query}`);
  },

  /**
   * GET /api/staff/save-money/history
   * Riwayat transaksi lengkap seorang siswa berdasarkan NISN
   */
  async getHistory(
    nisn: string,
    thang?: string
  ): Promise<{ riwayat_per_siswa: Record<string, SaveMoneyTransaction[]> }> {
    const searchParams = new URLSearchParams({ nisn });
    if (thang) searchParams.append('thang', thang);

    return apiClient.get<{ riwayat_per_siswa: Record<string, SaveMoneyTransaction[]> }>(
      `/api/staff/save-money/history?${searchParams.toString()}`
    );
  },

  /**
   * POST /api/staff/save-money/store
   * Menambah transaksi tabungan: Menabung (+) [kategori: 1] atau Mengambil (-) [kategori: 0]
   */
  async store(
    payload: CreateSaveMoneyPayload
  ): Promise<{ success: boolean; message: string }> {
    const isDeposit =
      payload.kategori === true ||
      payload.kategori === '1' ||
      String(payload.kategori) === '1' ||
      String(payload.kategori) === 'true';

    const formData = new FormData();
    formData.append('user_id', String(payload.user_id));
    formData.append('sirkulasi', String(payload.sirkulasi));
    formData.append('kategori', isDeposit ? '1' : '0');

    if (payload.tag) formData.append('tag', payload.tag);
    if (payload.ket_money) formData.append('ket_money', payload.ket_money);
    if (payload.invoice_money) formData.append('invoice_money', payload.invoice_money);

    return apiClient.post<{ success: boolean; message: string }>(
      '/api/staff/save-money/store',
      formData
    );
  },
};
