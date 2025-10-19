import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const buttonVariants = {
  primary: [
    'relative overflow-hidden',
    'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
    'shadow-lg shadow-blue-500/30',
    'hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]',
    'active:scale-[0.98]',
    'focus:ring-blue-500/50',
    'dark:from-blue-600 dark:to-blue-700',
    'dark:shadow-blue-500/20 dark:hover:shadow-blue-500/30',
    'transition-all duration-200',
  ].join(' '),

  secondary: [
    'relative overflow-hidden',
    'bg-slate-100/80 backdrop-blur-sm text-slate-900',
    'border border-slate-200/60',
    'shadow-sm',
    'hover:bg-slate-200/90 hover:border-slate-300/70 hover:scale-[1.02]',
    'active:scale-[0.98]',
    'focus:ring-slate-400/50',
    'dark:bg-slate-800/60 dark:text-white',
    'dark:border-slate-700/60',
    'dark:hover:bg-slate-700/70 dark:hover:border-slate-600/70',
    'transition-all duration-200',
  ].join(' '),

  danger: [
    'relative overflow-hidden',
    'bg-gradient-to-br from-red-500 to-red-600 text-white',
    'shadow-lg shadow-red-500/30',
    'hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02]',
    'active:scale-[0.98]',
    'focus:ring-red-500/50',
    'dark:from-red-600 dark:to-red-700',
    'dark:shadow-red-500/20 dark:hover:shadow-red-500/30',
    'transition-all duration-200',
  ].join(' '),

  ghost: [
    'bg-transparent text-slate-700',
    'hover:bg-slate-100/80 hover:backdrop-blur-sm',
    'active:bg-slate-200/80',
    'focus:ring-slate-400/30',
    'dark:text-slate-200',
    'dark:hover:bg-slate-800/50',
    'dark:active:bg-slate-700/50',
    'transition-all duration-200',
  ].join(' '),

  outline: [
    'relative overflow-hidden',
    'bg-white/50 backdrop-blur-sm',
    'border border-slate-300/60 text-slate-700',
    'shadow-sm',
    'hover:bg-white/80 hover:border-slate-400/70 hover:shadow-md',
    'active:bg-slate-50/80',
    'focus:ring-slate-400/50',
    'dark:bg-slate-900/30 dark:border-slate-600/60 dark:text-slate-200',
    'dark:hover:bg-slate-800/50 dark:hover:border-slate-500/70',
    'dark:active:bg-slate-800/70',
    'transition-all duration-200',
  ].join(' '),

  glass: [
    'relative overflow-hidden',
    'bg-white/30 backdrop-blur-xl',
    'border border-white/40 text-slate-900',
    'shadow-lg shadow-black/5',
    'hover:bg-white/40 hover:border-white/60 hover:shadow-xl hover:shadow-black/10',
    'active:bg-white/50',
    'focus:ring-blue-400/50',
    'dark:bg-white/10 dark:border-white/20 dark:text-white',
    'dark:hover:bg-white/15 dark:hover:border-white/30',
    'dark:active:bg-white/20',
    'transition-all duration-200',
  ].join(' '),
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'group inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin relative z-10" />}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
