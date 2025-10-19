import React from 'react';
import { cn } from '@/utils/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  className
}) => {
  return (
    <button
      type="button"
      id={id}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'shadow-inner',
        checked
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 focus:ring-blue-500/50 dark:from-blue-600 dark:to-blue-700'
          : 'bg-slate-200/80 backdrop-blur-sm focus:ring-slate-400/50 dark:bg-slate-700/60',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full',
          'bg-white shadow-sm',
          'transition-all duration-200',
          checked ? 'translate-x-6 shadow-md' : 'translate-x-1'
        )}
      />
    </button>
  );
};
