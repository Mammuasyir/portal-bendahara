import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'primary' | 'secondary' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    primary: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    secondary: 'bg-teal-50 text-teal-700 border border-teal-200/60',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs sm:text-sm gap-1.5',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
