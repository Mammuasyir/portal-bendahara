import React, { useState } from 'react';
import { CanteenAccount } from '../../../types/canteen';
import { MOCK_PAYMENT_CHANNELS } from '../../../data/mockSPP';
import { formatRupiah } from '../../../utils/formatters';
import { validateTopUpAmount, MIN_TOPUP_AMOUNT } from '../../../utils/validators';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { ConfirmActionModal } from '../../../components/common/ConfirmActionModal';
import { X, Check, ShieldCheck } from 'lucide-react';

export interface TopUpModalProps {
  isOpen: boolean;
  account: CanteenAccount | null;
  onClose: () => void;
  onConfirmTopUp: (amount: number, channelId: string) => Promise<void>;
  isProcessing: boolean;
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000];

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  account,
  onClose,
  onConfirmTopUp,
  isProcessing,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [customAmountInput, setCustomAmountInput] = useState<string>('100000');
  const [selectedChannelId, setSelectedChannelId] = useState<string>(MOCK_PAYMENT_CHANNELS[0].id);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmountInput(amount.toString());
    setValidationError(null);
  };

  const handleCustomInputChange = (value: string) => {
    setCustomAmountInput(value);
    const num = Number(value);
    setSelectedAmount(num);
    const val = validateTopUpAmount(num);
    if (!val.isValid) {
      setValidationError(val.message || 'Nominal tidak valid.');
    } else {
      setValidationError(null);
    }
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateTopUpAmount(selectedAmount);
    if (!val.isValid) {
      setValidationError(val.message || `Nominal top up minimal ${formatRupiah(MIN_TOPUP_AMOUNT)}.`);
      return;
    }
    setValidationError(null);
    setShowConfirmModal(true);
  };

  const handleExecuteTopUp = async () => {
    await onConfirmTopUp(selectedAmount, selectedChannelId);
    setShowConfirmModal(false);
    onClose();
  };

  const channel = MOCK_PAYMENT_CHANNELS.find((c) => c.id === selectedChannelId);

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="fixed inset-0" onClick={onClose} />

        <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Up Saldo Kantin Santri</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {account.studentName} ({account.grade})
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
            {/* Quick Presets */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                Pilih Nominal Cepat
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectPreset(amt)}
                      className={`
                        p-3 rounded-xl border text-center transition-all font-bold text-sm
                        ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/30'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }
                      `}
                    >
                      {formatRupiah(amt)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <Input
                label="Atau Masukkan Nominal Kustom"
                leftPrefix="Rp"
                type="number"
                value={customAmountInput}
                onChange={(e) => handleCustomInputChange(e.target.value)}
                placeholder="50000"
                error={validationError || undefined}
                helperText="Nominal top up minimal Rp50.000"
              />
            </div>

            {/* Payment Channel Selection */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                Pilih Saluran Pembayaran
              </label>
              <div className="space-y-2">
                {MOCK_PAYMENT_CHANNELS.map((ch) => {
                  const isSelected = selectedChannelId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedChannelId(ch.id)}
                      className={`
                        w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all
                        ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {ch.category === 'QRIS' ? 'QR' : 'VA'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{ch.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{ch.category}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-600">Bebas Biaya</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-teal-50/70 rounded-xl border border-teal-100 text-xs text-teal-800">
              <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Saldo langsung masuk secara instan ke akun kantin santri.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Batal
            </Button>
            <Button
              variant="secondary"
              onClick={handleProceedToConfirm}
              isLoading={isProcessing}
              disabled={!!validationError}
            >
              Lanjutkan Top Up
            </Button>
          </div>
        </div>
      </div>

      {/* Mandatory Confirmation Modal */}
      <ConfirmActionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecuteTopUp}
        isLoading={isProcessing}
        variant="secondary"
        title="Konfirmasi Top Up Saldo Kantin"
        description="Pastikan nominal dan santri penerima telah sesuai."
        amount={selectedAmount}
        amountLabel="Nominal Top Up"
        details={[
          { label: 'Penerima Saldo', value: `${account.studentName} (${account.grade})` },
          { label: 'NIS Santri', value: account.nis },
          { label: 'Metode Pembayaran', value: channel?.name || '-' },
          { label: 'Biaya Admin', value: 'Rp0 (Gratis)' },
        ]}
        confirmLabel="Ya, Top Up Sekarang"
        cancelLabel="Ubah Nominal"
      />
    </>
  );
};
