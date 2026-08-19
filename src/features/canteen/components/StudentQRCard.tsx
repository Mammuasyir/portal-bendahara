import React, { useState } from 'react';
import { CanteenAccount } from '../../../types/canteen';
import { formatRupiah } from '../../../utils/formatters';
import { Button } from '../../../components/common/Button';
import { ConfirmActionModal } from '../../../components/common/ConfirmActionModal';
import { 
  QrCode, 
  RotateCw, 
  ShoppingBag, 
  AlertTriangle,
  X 
} from 'lucide-react';

export interface StudentQRCardProps {
  account: CanteenAccount;
  onSimulatePurchase: (amount: number, merchantName: string, itemsSummary: string) => Promise<void>;
  isProcessing?: boolean;
}

const SAMPLE_CANTEEN_MENU = [
  { id: 'm1', name: 'Nasi Ayam Goreng + Es Teh', price: 18000, merchant: 'Stan Dapur Utama Asrama' },
  { id: 'm2', name: 'Soto Daging + Nasi Putih', price: 22000, merchant: 'Stan Dapur Utama Asrama' },
  { id: 'm3', name: 'Roti Bakar Coklat Keju', price: 10000, merchant: 'Kantin Snack & Bakery' },
  { id: 'm4', name: 'Susu UHT & Biskuit', price: 7000, merchant: 'Kantin Minimarket' },
  { id: 'm5', name: 'Paket Belanja Jumbo Asrama', price: 300000, merchant: 'Koperasi Santri' }, // intentional high price to test balance check!
];

export const StudentQRCard: React.FC<StudentQRCardProps> = ({
  account,
  onSimulatePurchase,
  isProcessing = false,
}) => {
  const [isCashierModalOpen, setIsCashierModalOpen] = useState<boolean>(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(SAMPLE_CANTEEN_MENU[0]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const handleStartPurchase = () => {
    setPurchaseError(null);
    if (account.balance < selectedMenuItem.price) {
      setPurchaseError(`Saldo tidak mencukupi! Saldo saat ini ${formatRupiah(account.balance)}, total belanja ${formatRupiah(selectedMenuItem.price)}.`);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecutePurchase = async () => {
    await onSimulatePurchase(
      selectedMenuItem.price,
      selectedMenuItem.merchant,
      selectedMenuItem.name
    );
    setShowConfirmModal(false);
    setIsCashierModalOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-5">
        <div>
          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider">
            QR Identitas Transaksi Santri
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-2">
            {account.studentName}
          </h3>
          <p className="text-xs text-slate-500">{account.grade} • NIS: {account.nis}</p>
        </div>

        {/* QR Box Visual */}
        <div className="p-4 bg-slate-50 rounded-3xl border-2 border-dashed border-teal-200 relative group shadow-inner">
          <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white rounded-2xl p-3 border border-slate-200 flex flex-col items-center justify-center shadow-sm">
            {/* SVG Stylized QR Pattern */}
            <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center p-3 text-white relative overflow-hidden">
              <QrCode className="w-full h-full text-white" />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-500/30 to-transparent pointer-events-none" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <RotateCw className="w-3 h-3 text-teal-600 animate-spin" />
            <span>Kode dinamis diperbarui</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 max-w-xs">
          Tunjukkan QR Code ini ke petugas kasir kantin asrama untuk melakukan pembayaran instan tanpa uang tunai.
        </p>

        {/* Cashier Simulation Trigger */}
        <div className="w-full pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setIsCashierModalOpen(true)}
            leftIcon={<ShoppingBag className="w-4 h-4 text-teal-600" />}
            className="border-teal-200 text-teal-800 hover:bg-teal-50/50"
          >
            Simulasi Scan Kasir Kantin (Demo)
          </Button>
        </div>
      </div>

      {/* Cashier Simulation Modal */}
      {isCashierModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setIsCashierModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-10 border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-5 h-5 text-teal-600" /> Kasir Kantin Asrama (Simulasi)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih menu untuk menguji validasi saldo dan potongan otomatis
                </p>
              </div>
              <button
                onClick={() => setIsCashierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {purchaseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{purchaseError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Pilih Menu Jajan Santri:
              </label>
              {SAMPLE_CANTEEN_MENU.map((item) => {
                const isSelected = selectedMenuItem.id === item.id;
                const isAffordable = account.balance >= item.price;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedMenuItem(item);
                      setPurchaseError(null);
                    }}
                    className={`
                      w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all text-xs
                      ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/70 font-semibold ring-1 ring-teal-400'
                          : 'border-slate-200 hover:bg-slate-50'
                      }
                    `}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.merchant}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">{formatRupiah(item.price)}</span>
                      {!isAffordable && (
                        <span className="text-[10px] text-rose-600 font-semibold">Saldo kurang</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setIsCashierModalOpen(false)}>
                Batal
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleStartPurchase}
                isLoading={isProcessing}
              >
                Proses Belanja
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Purchase */}
      <ConfirmActionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecutePurchase}
        isLoading={isProcessing}
        variant="secondary"
        title="Konfirmasi Pembayaran Kasir Kantin"
        description="Saldo akan dipotong secara otomatis dari akun santri."
        amount={selectedMenuItem.price}
        amountLabel="Nominal Belanja"
        details={[
          { label: 'Nama Santri', value: `${account.studentName} (${account.nis})` },
          { label: 'Menu Pesanan', value: selectedMenuItem.name },
          { label: 'Stan Kantin', value: selectedMenuItem.merchant },
          { label: 'Sisa Saldo Setelah Transaksi', value: formatRupiah(account.balance - selectedMenuItem.price) },
        ]}
        confirmLabel="Konfirmasi Bayar"
        cancelLabel="Kembali"
      />
    </>
  );
};
