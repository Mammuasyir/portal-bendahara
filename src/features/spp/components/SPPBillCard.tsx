import React from 'react';
import { SPPBill } from '../../../types/spp';
import { formatRupiah, formatDate } from '../../../utils/formatters';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Calendar, CreditCard, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export interface SPPBillCardProps {
  bill: SPPBill;
  onPayClick?: (bill: SPPBill) => void;
  showPayButton?: boolean;
}

export const SPPBillCard: React.FC<SPPBillCardProps> = ({
  bill,
  onPayClick,
  showPayButton = true,
}) => {
  const getStatusBadge = () => {
    switch (bill.status) {
      case 'lunas':
        return (
          <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
            Lunas
          </Badge>
        );
      case 'jatuh_tempo':
        return (
          <Badge variant="danger" size="sm" icon={<AlertCircle className="w-3.5 h-3.5" />}>
            Jatuh Tempo ({formatDate(bill.dueDate)})
          </Badge>
        );
      case 'belum_bayar':
        return (
          <Badge variant="warning" size="sm">
            Belum Bayar
          </Badge>
        );
    }
  };

  const isUnpaid = bill.status === 'belum_bayar' || bill.status === 'jatuh_tempo';

  return (
    <div className={`
      bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm
      ${bill.status === 'jatuh_tempo' ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-200'}
    `}>
      {/* Header Info */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              SPP {bill.month} {bill.year}
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              (TA {bill.academicYear})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {bill.studentName} • {bill.grade}
          </p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Amount & Due Date */}
      <div className="my-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-400 font-medium block">Nominal Tagihan</span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatRupiah(bill.amount)}
          </span>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-400 font-medium block flex items-center sm:justify-end gap-1">
            <Calendar className="w-3.5 h-3.5" /> Batas Pembayaran
          </span>
          <span className={`text-xs font-semibold ${bill.status === 'jatuh_tempo' ? 'text-rose-600' : 'text-slate-700'}`}>
            {formatDate(bill.dueDate, 'long')}
          </span>
        </div>
      </div>

      {/* WhatsApp Status Bar & Action */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* WA Notification Info Read-Only */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 max-w-full truncate">
          <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="truncate">
            WA Reminder: <strong className="text-slate-700 font-medium">{bill.waNotification.sentAt || 'Terkirim'}</strong>
          </span>
        </div>

        {/* Action Button */}
        {isUnpaid && showPayButton && onPayClick && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<CreditCard className="w-4 h-4" />}
            onClick={() => onPayClick(bill)}
            className="w-full sm:w-auto"
          >
            Bayar Tagihan
          </Button>
        )}

        {bill.status === 'lunas' && bill.paidAt && (
          <span className="text-xs text-slate-500 self-end sm:self-auto font-medium">
            Dibayar: <span className="text-slate-800 font-semibold">{bill.paidAt}</span>
          </span>
        )}
      </div>
    </div>
  );
};
