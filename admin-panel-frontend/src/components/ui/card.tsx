import * as React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'elevated';
  withBlob?: boolean;
}

const cardVariants = {
  glass: cn(
    'relative overflow-hidden',
    'bg-white/60 backdrop-blur-xl',
    'border border-white/40',
    'shadow-[0_8px_32px_rgba(0,0,0,0.06)]',
    'dark:bg-slate-900/60 dark:border-white/10'
  ),
  solid: cn(
    'bg-white',
    'border border-gray-200',
    'shadow-sm',
    'dark:bg-slate-800 dark:border-slate-700'
  ),
  elevated: cn(
    'relative overflow-hidden',
    'bg-white/80 backdrop-blur-lg',
    'border border-white/50',
    'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]',
    'dark:bg-slate-900/80 dark:border-white/20',
    'dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]'
  ),
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'solid', withBlob = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-xl p-6', cardVariants[variant], className)}
        {...props}
      >
        {withBlob && variant === 'glass' && (
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="glass-blob absolute -left-12 top-4 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />
            <div className="glass-blob glass-blob--reverse absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-cyan-400/15 blur-2xl" />
          </div>
        )}
        <div className="relative">{children}</div>
      </div>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
