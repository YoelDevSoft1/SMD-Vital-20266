import * as React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'glass' | 'solid';
}

export function Input({ label, error, helperText, variant = 'glass', className, ...props }: InputProps) {
  const baseStyles = [
    'w-full px-4 py-2.5 rounded-lg text-sm',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:cursor-not-allowed',
    'transition-all duration-200',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
  ];

  const variantStyles = {
    glass: [
      'bg-white/50 backdrop-blur-sm',
      'border border-slate-200/60',
      'text-slate-900',
      'focus:bg-white/70 focus:border-blue-400/70 focus:ring-blue-400/50',
      'disabled:bg-slate-100/50 disabled:text-slate-400',
      'dark:bg-slate-900/30 dark:border-slate-700/60',
      'dark:text-white',
      'dark:focus:bg-slate-900/50 dark:focus:border-blue-500/70 dark:focus:ring-blue-500/50',
      'dark:disabled:bg-slate-800/30 dark:disabled:text-slate-500',
    ].join(' '),
    solid: [
      'bg-white',
      'border border-slate-300',
      'text-slate-900',
      'focus:border-blue-500 focus:ring-blue-500/50',
      'disabled:bg-slate-100 disabled:text-slate-400',
      'dark:bg-slate-800',
      'dark:border-slate-600',
      'dark:text-white',
      'dark:focus:border-blue-500 dark:focus:ring-blue-500/50',
      'dark:disabled:bg-slate-700 dark:disabled:text-slate-500',
    ].join(' '),
  };

  const errorStyles = error
    ? 'border-red-400/70 focus:border-red-500/70 focus:ring-red-500/50 dark:border-red-500/70 dark:focus:border-red-500/70 dark:focus:ring-red-500/50'
    : '';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        className={cn(baseStyles, variantStyles[variant], errorStyles, className)}
        {...props}
      />
      {error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
}