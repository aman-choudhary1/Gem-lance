import React, { forwardRef, useId } from 'react';

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  /** Element rendered at the right edge of the input (e.g. show/hide password). */
  trailing?: React.ReactNode;
  hint?: React.ReactNode;
  invalid?: boolean;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(({ label, icon, trailing, hint, invalid, className = '', ...rest }, ref) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
        {label}
      </label>
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">{icon}</span>
        <input
          id={id}
          ref={ref}
          aria-invalid={invalid || undefined}
          className={`w-full pl-12 ${trailing ? 'pr-12' : 'pr-4'} py-3.5 rounded-2xl text-[15px] bg-white dark:bg-white/[0.05] border text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 transition shadow-sm ${
            invalid
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
              : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 focus:ring-emerald-500/15'
          } ${className}`}
          {...rest}
        />
        {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {hint && <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
});
AuthField.displayName = 'AuthField';
