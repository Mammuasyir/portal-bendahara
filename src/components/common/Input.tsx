import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftPrefix?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftPrefix,
      leftIcon,
      rightElement,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftPrefix && (
            <span className="absolute left-3.5 text-sm font-semibold text-slate-400 select-none pointer-events-none">
              {leftPrefix}
            </span>
          )}
          {leftIcon && !leftPrefix && (
            <span className="absolute left-3.5 text-slate-400 select-none pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              w-full rounded-xl border bg-white text-slate-900 text-sm transition-colors duration-150
              py-2.5 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400
              ${leftPrefix ? 'pl-10 pr-3.5' : leftIcon ? 'pl-10 pr-3.5' : 'px-3.5'}
              ${rightElement ? 'pr-11' : ''}
              ${
                error
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 hover:border-slate-300'
              }
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
