import * as React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'elevated';
  withBlob?: boolean;
  /** Add hover/focus interactivity styling (used for clickable cards). */
  interactive?: boolean;
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
    'bg-card',
    'border border-border',
    'shadow-soft-sm'
  ),
  elevated: cn(
    'relative overflow-hidden',
    'bg-card/95',
    'border border-border',
    'shadow-soft-lg'
  ),
};

const Tarjeta = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'solid', withBlob = false, interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl p-6',
          cardVariants[variant],
          interactive &&
            'cursor-pointer transition-shadow duration-150 hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className,
        )}
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
Tarjeta.displayName = 'Tarjeta';

const TarjetaEncabezado = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));
TarjetaEncabezado.displayName = 'TarjetaEncabezado';

const TarjetaTitulo = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
TarjetaTitulo.displayName = 'TarjetaTitulo';

const TarjetaDescripcion = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
));
TarjetaDescripcion.displayName = 'TarjetaDescripcion';

const TarjetaContenido = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));
TarjetaContenido.displayName = 'TarjetaContenido';

const TarjetaPie = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-0', className)}
    {...props}
  />
));
TarjetaPie.displayName = 'TarjetaPie';

export { Tarjeta, TarjetaEncabezado, TarjetaPie, TarjetaTitulo, TarjetaDescripcion, TarjetaContenido };
