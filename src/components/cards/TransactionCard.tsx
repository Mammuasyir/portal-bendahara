import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Receipt, Utensils, Wallet } from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export interface TransactionCardProps {
  title: string;
  subtitle?: string;
  amount: number;
  type?: 'in' | 'out' | 'neutral';
  date: string;
  statusBadge?: {
    label: string;
    variant: 'success' | 'danger' | 'warning' | 'primary' | 'secondary' | 'neutral';
  };
  categoryTag?: string;
  iconType?: 'spp' | 'canteen' | 'expense' | 'topup';
  onClick?: () => void;
  className?: string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  title,
  subtitle,
  amount,
  type = 'in',
  date,
  statusBadge,
  categoryTag,
  iconType = 'spp',
  onClick,
  className = '',
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'spp':
        return <Receipt className="w-5 h-5" />;
      case 'canteen':
        return <Utensils className="w-5 h-5" />;
      case 'topup':
        return <ArrowDownLeft className="w-5 h-5" />;
      case 'expense':
        return <ArrowUpRight className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const getIconBg = () => {
    if (type === 'out' || iconType === 'expense') {
      return 'bg-rose-50 text-rose-600 border border-rose-100';
    }
    if (iconType === 'canteen') {
      return 'bg-teal-50 text-teal-600 border border-teal-100';
    }
    return 'bg-blue-50 text-blue-600 border border-blue-100';
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200
        flex items-center justify-between gap-3 select-none
        ${onClick ? 'cursor-pointer active:scale-[0.99] hover:border-slate-300' : ''}
        ${className}
      `}
    >
      {/* Left Icon & Information */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg()}`}>
          {getIcon()}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate leading-snug">
            {title}
          </h4>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            {subtitle && (
              <span className="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-xs">
                {subtitle}
              </span>
            )}
            {subtitle && <span className="text-slate-300 text-xs hidden sm:inline">•</span>}
            <span className="text-[11px] text-slate-400 font-medium">
              {formatDate(date, 'short')}
            </span>
          </div>
        </div>
      </div>

      {/* Right Amount & Status */}
      <div className="text-right flex-shrink-0">
        <span
          className={`text-sm sm:text-base font-bold block tracking-tight ${
            type === 'out' || iconType === 'expense'
              ? 'text-rose-600'
              : type === 'in'
              ? 'text-emerald-700'
              : 'text-slate-900'
          }`}
        >
          {type === 'out' ? `-${formatRupiah(amount)}` : type === 'in' ? `+${formatRupiah(amount)}` : formatRupiah(amount)}
        </span>

        <div className="flex items-center justify-end gap-1.5 mt-1">
          {categoryTag && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {categoryTag}
            </span>
          )}
          {statusBadge && (
            <Badge variant={statusBadge.variant} size="sm">
              {statusBadge.label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
