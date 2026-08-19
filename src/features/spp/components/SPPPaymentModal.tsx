import React, { useState } from 'react';
import { SPPBill, PaymentChannel } from '../../../types/spp';
import { MOCK_PAYMENT_CHANNELS } from '../../../data/mockSPP';
import { formatRupiah } from '../../../utils/formatters';
import { ConfirmActionModal } from '../../../components/common/ConfirmActionModal';
import { Button } from '../../../components/common/Button';
import { X, Check, ShieldCheck } from 'lucide-react';

export interface SPPPaymentModalProps {
  isOpen: boolean;
  bill: SPPBill | null;
  onClose: () => void;
  onPaymentSuccess: (updatedBill: SPPBill) => void;
  isProcessing: boolean;
  onConfirmPay: (billId: string, channelId: string) => Promise<void>;
}

export const SPPPaymentModal: React.FC<SPPPaymentModalProps> = ({
  isOpen,
  bill,
  onClose,
  isProcessing,
  onConfirmPay,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>(MOCK_PAYMENT_CHANNELS[0]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  if (!isOpen || !bill) return null;

  const handleProceedToConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleExecutePayment = async () => {
    await onConfirmPay(bill.id, selectedChannel.id);
    setShowConfirmModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="fixed inset-0" onClick={onClose} />

        <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pembayaran SPP Online</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {bill.studentName} • SPP {bill.month} {bill.year}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5">
            {/* Total Amount Box */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-blue-100 font-medium block">Total Pembayaran</span>
                <span className="text-2xl font-extrabold">{formatRupiah(bill.amount)}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full text-white font-medium">
                  Bebas Biaya Admin
                </span>
              </div>
            </div>

            {/* Payment Channel Selection */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                Pilih Metode Pembayaran
              </label>
              <div className="space-y-2">
                {MOCK_PAYMENT_CHANNELS.map((channel) => {
                  const isSelected = selectedChannel.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => setSelectedChannel(channel)}
                      className={`
                        w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all
                        ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {channel.category === 'QRIS' ? 'QR' : 'VA'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{channel.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{channel.category}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-600">Gratis</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Verifikasi otomatis real-time & kuitansi langsung dikirim via WhatsApp.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleProceedToConfirm} isLoading={isProcessing}>
              Lanjutkan Pembayaran
            </Button>
          </div>
        </div>
      </div>

      {/* Mandatory Financial Confirmation Modal */}
      <ConfirmActionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecutePayment}
        isLoading={isProcessing}
        title="Konfirmasi Pembayaran SPP"
        description="Harap periksa kembali detail pembayaran di bawah ini."
        amount={bill.amount}
        amountLabel="Total Nominal SPP"
        details={[
          { label: 'Nama Santri', value: `${bill.studentName} (${bill.grade})` },
          { label: 'Periode Tagihan', value: `SPP ${bill.month} ${bill.year}` },
          { label: 'Metode Pembayaran', value: selectedChannel.name },
          { label: 'Biaya Transaksi', value: 'Rp0 (Ditanggung Sekolah)' },
          { label: 'Notifikasi WA', value: bill.waNotification.recipientPhone },
        ]}
        confirmLabel="Ya, Bayar Sekarang"
        cancelLabel="Ubah Metode"
      />
    </>
  );
};
