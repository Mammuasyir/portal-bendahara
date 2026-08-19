import { apiClient } from './apiClient';
import {
  BelanjaInitResponse,
  BelanjaTransaction,
  BelanjaStatsResponse,
  CreateBelanjaPayload,
  UpdateBelanjaPayload,
} from '../types/backend';

export const belanjaService = {
  /**
   * GET /api/staff/belanja/init
   * Inisialisasi halaman belanja: daftar siswa + saldo per siswa + locked_tag
   */
  async init(thang?: string): Promise<BelanjaInitResponse> {
    const query = thang ? `?thang=${thang}` : '';
    return apiClient.get<BelanjaInitResponse>(`/api/staff/belanja/init${query}`);
  },

  /**
   * GET /api/staff/belanja/recent
   * Transaksi belanja terbaru (default: 3 hari terakhir)
   */
  async getRecent(params?: {
    date_from?: string;
    date_to?: string;
    tag?: string;
  }): Promise<{ locked_tag: string | null; transactions: BelanjaTransaction[] }> {
    const searchParams = new URLSearchParams();
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);
    if (params?.tag) searchParams.append('tag', params.tag);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<{ locked_tag: string | null; transactions: BelanjaTransaction[] }>(
      `/api/staff/belanja/recent${query}`
    );
  },

  /**
   * GET /api/staff/belanja/stats
   * Statistik belanja per tag (kantin, kafe) & tren harian
   */
  async getStats(params?: {
    date_from?: string;
    date_to?: string;
    tag?: string;
  }): Promise<BelanjaStatsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);
    if (params?.tag) searchParams.append('tag', params.tag);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<BelanjaStatsResponse>(`/api/staff/belanja/stats${query}`);
  },

  /**
   * POST /api/staff/belanja/store
   * Membuat transaksi belanja santri baru
   */
  async store(payload: CreateBelanjaPayload): Promise<{ success: boolean; message: string; id: number; invoice_url?: string }> {
    const formData = new FormData();
    formData.append('user_id', String(payload.user_id));
    formData.append('sirkulasi', String(payload.sirkulasi));
    if (payload.tag) formData.append('tag', payload.tag);
    if (payload.ket_money) formData.append('ket_money', payload.ket_money);
    if (payload.invoice_money) formData.append('invoice_money', payload.invoice_money);

    return apiClient.post<{ success: boolean; message: string; id: number; invoice_url?: string }>(
      '/api/staff/belanja/store',
      formData
    );
  },

  /**
   * PUT /api/staff/belanja/transactions/:id
   * Edit transaksi belanja (maksimal 3 hari sejak dibuat)
   */
  async update(
    id: number,
    payload: UpdateBelanjaPayload
  ): Promise<{ success: boolean; message: string; sirkulasi: number; ket_money?: string; invoice_money?: string }> {
    const formData = new FormData();
    formData.append('sirkulasi', String(payload.sirkulasi));
    if (payload.ket_money) formData.append('ket_money', payload.ket_money);
    if (payload.invoice_money) formData.append('invoice_money', payload.invoice_money);

    return apiClient.put<{ success: boolean; message: string; sirkulasi: number; ket_money?: string; invoice_money?: string }>(
      `/api/staff/belanja/transactions/${id}`,
      formData
    );
  },
};
