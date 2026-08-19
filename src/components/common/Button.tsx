import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none touch-target';

  const variantStyles = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white focus:ring-primary-500 shadow-sm shadow-primary-600/20',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 active:bg-secondary-800 text-white focus:ring-secondary-500 shadow-sm shadow-secondary-600/20',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 focus:ring-slate-400',
    danger: 'bg-danger-600 hover:bg-danger-700 active:bg-danger-800 text-white focus:ring-danger-500 shadow-sm shadow-danger-600/20',
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 focus:ring-slate-300',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px] gap-1.5',
    md: 'px-4 py-2.5 text-sm min-h-[44px] gap-2',
    lg: 'px-5 py-3.5 text-base min-h-[50px] gap-2.5',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
