import React from 'react';
import { cn } from '@/utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  variant?: 'glass' | 'solid';
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
  value: string;
}

interface SelectValueProps {
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ children, variant = 'glass', className, ...props }) => {
  const baseStyles = [
    'w-full px-4 py-2.5 rounded-lg text-sm',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:cursor-not-allowed',
    'transition-all duration-200',
    'appearance-none',
    'bg-[length:20px_20px]',
    'bg-[position:right_0.75rem_center]',
    'bg-no-repeat',
    'pr-10',
  ];

  const variantStyles = {
    glass: cn(
      'bg-white/50 backdrop-blur-sm',
      'border border-slate-200/60',
      'text-slate-900',
      'focus:bg-white/70 focus:border-blue-400/70 focus:ring-blue-400/50',
      'disabled:bg-slate-100/50 disabled:text-slate-400',
      'dark:bg-slate-900/30 dark:border-slate-700/60',
      'dark:text-white',
      'dark:focus:bg-slate-900/50 dark:focus:border-blue-500/70 dark:focus:ring-blue-500/50',
      'dark:disabled:bg-slate-800/30 dark:disabled:text-slate-500',
      "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA3LjVMMTAgMTIuNUwxNSA3LjUiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')]"
    ),
    solid: cn(
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
      "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA3LjVMMTAgMTIuNUwxNSA3LjUiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')]"
    ),
  };

  return (
    <select className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </select>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
    </div>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  return <>{children}</>;
};

export const SelectItem: React.FC<SelectItemProps> = ({ children, ...props }) => {
  return <option {...props}>{children}</option>;
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <option value="">{placeholder}</option>;
};