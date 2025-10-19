import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'elevated';
  withBlob?: boolean;
}

const cardVariants = {
  glass: 'relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:bg-slate-900/60 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
  solid: 'bg-white border border-gray-200 shadow-sm dark:bg-slate-800 dark:border-slate-700',
  elevated: 'relative overflow-hidden bg-white/80 backdrop-blur-lg border border-white/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:bg-slate-900/80 dark:border-white/20 dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]',
};

export function Card({ className, variant = 'glass', withBlob = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl transition-all duration-300', cardVariants[variant], className)}
      {...props}
    >
      {withBlob && variant === 'glass' && (
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 blur-3xl" />
        </div>
      )}
      {withBlob && variant === 'elevated' && (
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 dark:from-white/10 dark:via-transparent dark:to-white/5" />
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

interface CardSubComponentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...props }: CardSubComponentProps) {
  return <div className={cn('p-6 pb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardSubComponentProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-900 dark:text-white', className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: CardSubComponentProps) {
  return (
    <p className={cn('text-sm text-slate-600 dark:text-slate-300', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: CardSubComponentProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardSubComponentProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
