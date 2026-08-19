import { MOCK_CANTEEN_ACCOUNTS, MOCK_CANTEEN_TRANSACTIONS } from '../data/mockCanteen';
import { MOCK_PAYMENT_CHANNELS } from '../data/mockSPP';
import { 
  CanteenAccount, 
  CanteenTransaction, 
  TopUpPayload, 
  PurchasePayload 
} from '../types/canteen';
import { validateTopUpAmount, validateSufficientBalance } from '../utils/validators';
import { apiClient } from './apiClient';
import { IS_LIVE } from '../config/env';

// In-memory states for live reactive mutations / fallback
let canteenAccountsState: CanteenAccount[] = [...MOCK_CANTEEN_ACCOUNTS];
let canteenTransactionsState: CanteenTransaction[] = [...MOCK_CANTEEN_TRANSACTIONS];

export const canteenService = {
  /**
   * Mengambil informasi akun saldo santri dari API / fallback
   */
  async getAccount(studentId: string): Promise<CanteenAccount> {
    if (IS_LIVE) {
      try {
        const res = await apiClient.get(`/api/staff/save-money/init?studentId=${studentId}`);
        const accountData = res.account || res.student || res.member || res.data?.account || res.data;
        if (accountData) {
          return {
            studentId: String(accountData.student_id || accountData.id || studentId),
            studentName: accountData.student_name || accountData.nama || accountData.name || 'Santri Asrama',
            grade: accountData.grade || accountData.kelas || accountData.asrama || 'Kelas XII-IPA 1',
            nis: String(accountData.nis || accountData.nisn || accountData.identifier || '202401089'),
            balance: Number(accountData.balance ?? accountData.saldo ?? accountData.total_saldo ?? 0),
            lastUpdated: accountData.last_updated || accountData.updated_at || new Date().toLocaleDateString('id-ID'),
          };
        }
      } catch (err) {
        console.warn('Live API /api/staff/save-money/init fallback to local cache:', err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
    const account = canteenAccountsState.find((a) => a.studentId === studentId);
    if (!account) {
      return {
        studentId,
        studentName: 'Santri Asrama',
        grade: 'Kelas XII-IPA 1',
        nis: '202401089',
        balance: 150000,
        lastUpdated: new Date().toLocaleDateString('id-ID'),
      };
    }
    return { ...account };
  },

  /**
   * Mengambil semua akun santri yang tersedia langsung dari Backend API
   */
  async getAllAccounts(): Promise<CanteenAccount[]> {
    if (IS_LIVE) {
      try {
        const res = await apiClient.get('/api/staff/save-money/init');
        const list =
          res.accounts ||
          res.students ||
          res.members ||
          res.santri ||
          res.data?.accounts ||
          res.data?.students ||
          res.data?.members ||
          (Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);

        if (Array.isArray(list) && list.length > 0) {
          const liveAccounts: CanteenAccount[] = list.map((item: any) => ({
            studentId: String(item.student_id || item.id || item.nis || `std-${Math.random()}`),
            studentName: item.student_name || item.name || item.nama || item.nama_lengkap || 'Santri',
            grade: item.grade || item.kelas || item.asrama || item.rombel || 'Kelas Asrama',
            nis: String(item.nis || item.nisn || item.identifier || item.id || '-'),
            balance: Number(item.balance ?? item.saldo ?? item.total_saldo ?? item.nominal ?? 0),
            lastUpdated: item.last_updated || item.updated_at || new Date().toLocaleDateString('id-ID'),
          }));

          // Sinkronisasi ke in-memory state agar komponen lain dapat menggunakannya
          canteenAccountsState = liveAccounts;
          return liveAccounts;
        }
      } catch (err) {
        console.warn('Live API /api/staff/save-money/init all accounts fallback:', err);
      }
    }

    return [...canteenAccountsState];
  },

  /**
   * Mengambil riwayat mutasi gabungan (top-up & jajan)
   * Terintegrasi dengan /api/staff/save-money/history
   */
  async getTransactions(studentId: string): Promise<CanteenTransaction[]> {
    if (IS_LIVE) {
      try {
        const res = await apiClient.get(`/api/staff/save-money/history?studentId=${studentId}`);
        const historyList = res.transactions || res.history || res.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(historyList) && historyList.length > 0) {
          return historyList.map((item: any) => ({
            id: String(item.id || `ctx-${Math.random()}`),
            studentId: String(item.student_id || studentId),
            type: (item.type === 'in' || item.type === 'topup' ? 'topup' : 'purchase') as 'topup' | 'purchase',
            amount: Number(item.amount || item.nominal || 0),
            balanceAfter: Number(item.balance_after || item.saldo_akhir || 0),
            timestamp: item.timestamp || item.created_at || new Date().toISOString(),
            title: item.title || item.keterangan || (item.type === 'topup' ? 'Top Up Saldo' : 'Belanja Kantin'),
            merchantName: item.merchant_name || item.lokasi || 'Kantin Asrama',
            referenceNo: item.reference_no || `TRX-${item.id || Date.now()}`,
            paymentChannel: item.payment_channel || 'Cashless Wallet',
          }));
        }
      } catch (err) {
        console.warn('Live API /api/staff/save-money/history fallback:', err);
      }
    }

    return canteenTransactionsState
      .filter((t) => t.studentId === studentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  /**
   * Melakukan Top-Up saldo kantin santri
   * Terintegrasi dengan POST /api/staff/save-money/store
   */
  async topUp(payload: TopUpPayload): Promise<{ account: CanteenAccount; transaction: CanteenTransaction }> {
    const validation = validateTopUpAmount(payload.amount);
    if (!validation.isValid) {
      throw new Error(validation.message || 'Nominal top-up tidak valid.');
    }

    if (IS_LIVE) {
      try {
        const res = await apiClient.post('/api/staff/save-money/store', {
          student_id: payload.studentId,
          type: 'topup',
          amount: payload.amount,
          payment_channel_id: payload.paymentChannelId,
        });

        if (res) {
          const acc = await this.getAccount(payload.studentId);
          const channel = MOCK_PAYMENT_CHANNELS.find((c) => c.id === payload.paymentChannelId);
          const channelName = channel ? channel.name : 'Virtual Account Transfer';
          
          const newTx: CanteenTransaction = {
            id: `ctx-${Date.now()}`,
            studentId: payload.studentId,
            type: 'topup',
            amount: payload.amount,
            balanceAfter: acc.balance,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            title: `Top Up Saldo via ${channelName}`,
            merchantName: 'Portal Bendahara App',
            referenceNo: `TOP-KTN-${Date.now().toString().slice(-8)}`,
            paymentChannel: channelName,
          };
          canteenTransactionsState.unshift(newTx);
          return { account: acc, transaction: newTx };
        }
      } catch (err) {
        console.warn('Live API /api/staff/save-money/store fallback to local mutation:', err);
      }
    }

    // Local / In-memory mutation
    await new Promise((resolve) => setTimeout(resolve, 300));
    const accountIndex = canteenAccountsState.findIndex((a) => a.studentId === payload.studentId);
    if (accountIndex === -1) {
      throw new Error('Santri tidak ditemukan.');
    }

    const channel = MOCK_PAYMENT_CHANNELS.find((c) => c.id === payload.paymentChannelId);
    const channelName = channel ? channel.name : 'Virtual Account Transfer';

    const prevAccount = canteenAccountsState[accountIndex];
    const newBalance = prevAccount.balance + payload.amount;
    const now = new Date();
    const formattedTimestamp = now.toISOString().replace('T', ' ').slice(0, 16);

    const updatedAccount: CanteenAccount = {
      ...prevAccount,
      balance: newBalance,
      lastUpdated: `${now.toLocaleDateString('id-ID')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`,
    };

    const newTransaction: CanteenTransaction = {
      id: `ctx-${Date.now()}`,
      studentId: payload.studentId,
      type: 'topup',
      amount: payload.amount,
      balanceAfter: newBalance,
      timestamp: formattedTimestamp,
      title: `Top Up Saldo via ${channelName}`,
      merchantName: 'Portal Bendahara App',
      referenceNo: `TOP-KTN-${Date.now().toString().slice(-8)}`,
      paymentChannel: channelName,
    };

    canteenAccountsState[accountIndex] = updatedAccount;
    canteenTransactionsState.unshift(newTransaction);

    return { account: updatedAccount, transaction: newTransaction };
  },

  /**
   * Simulasi transaksi belanja/jajan di kasir kantin
   */
  async purchase(payload: PurchasePayload): Promise<{ account: CanteenAccount; transaction: CanteenTransaction }> {
    const accountIndex = canteenAccountsState.findIndex((a) => a.studentId === payload.studentId);
    if (accountIndex === -1) {
      throw new Error('Santri tidak ditemukan.');
    }

    const currentAccount = canteenAccountsState[accountIndex];

    const balanceValidation = validateSufficientBalance(currentAccount.balance, payload.amount);
    if (!balanceValidation.isValid) {
      throw new Error(balanceValidation.message || 'Saldo kantin tidak mencukupi.');
    }

    if (IS_LIVE) {
      try {
        await apiClient.post('/api/staff/save-money/store', {
          student_id: payload.studentId,
          type: 'purchase',
          amount: payload.amount,
          merchant_name: payload.merchantName,
          items: payload.itemsSummary,
        });
      } catch (err) {
        console.warn('Live purchase store API fallback:', err);
      }
    }

    const newBalance = currentAccount.balance - payload.amount;
    const now = new Date();
    const formattedTimestamp = now.toISOString().replace('T', ' ').slice(0, 16);

    const updatedAccount: CanteenAccount = {
      ...currentAccount,
      balance: newBalance,
      lastUpdated: `${now.toLocaleDateString('id-ID')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`,
    };

    const newTransaction: CanteenTransaction = {
      id: `ctx-${Date.now()}`,
      studentId: payload.studentId,
      type: 'purchase',
      amount: payload.amount,
      balanceAfter: newBalance,
      timestamp: formattedTimestamp,
      title: payload.itemsSummary || 'Belanja Kantin Asrama',
      merchantName: payload.merchantName || 'Stan Kantin Asrama',
      referenceNo: `POS-KTN-${Date.now().toString().slice(-8)}`,
      paymentChannel: 'QR Santri Scanner',
    };

    canteenAccountsState[accountIndex] = updatedAccount;
    canteenTransactionsState.unshift(newTransaction);

    return { account: updatedAccount, transaction: newTransaction };
  },

  /**
   * Reset data mock
   */
  resetState(): void {
    canteenAccountsState = [...MOCK_CANTEEN_ACCOUNTS];
    canteenTransactionsState = [...MOCK_CANTEEN_TRANSACTIONS];
  },
};
