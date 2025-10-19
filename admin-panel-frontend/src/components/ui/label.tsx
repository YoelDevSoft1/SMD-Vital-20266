import * as React from 'react';
import { cn } from '@/utils/cn';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-slate-700 dark:text-slate-300',
        'transition-colors duration-200',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-red-500 dark:text-red-400">*</span>}
    </label>
  );
}