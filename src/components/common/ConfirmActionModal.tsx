import React, { useEffect } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { Button } from './Button';
import { formatRupiah } from '../../utils/formatters';

export interface DetailItem {
  label: string;
  value: string;
}

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  amount?: number;
  amountLabel?: string;
  details?: DetailItem[];
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'primary' | 'danger' | 'secondary';
  iconType?: 'confirm' | 'warning';
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  amount,
  amountLabel = 'Total Nominal',
  details = [],
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  isLoading = false,
  variant = 'primary',
  iconType = 'confirm',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      {/* Backdrop click handler */}
      <div 
        className="fixed inset-0" 
        onClick={() => {
          if (!isLoading) onClose();
        }} 
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                variant === 'danger' || iconType === 'warning'
                  ? 'bg-rose-50 text-rose-600'
                  : variant === 'secondary'
                  ? 'bg-teal-50 text-teal-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {iconType === 'warning' || variant === 'danger' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <HelpCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {amount !== undefined && (
            <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
                {amountLabel}
              </span>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatRupiah(amount)}
              </span>
            </div>
          )}

          {details.length > 0 && (
            <div className="bg-slate-50/60 rounded-xl p-3.5 space-y-2 border border-slate-100 text-xs">
              {details.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-semibold text-slate-900 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'secondary' ? 'secondary' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1 sm:flex-initial"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
