/**
 * Boton — primary interactive primitive.
 *
 * Variants:
 *   - primary    → solid brand gradient, the default for key CTAs
 *   - secondary  → muted neutral background, for "Cancelar" etc.
 *   - danger     → destructive red gradient
 *   - success    → success-colored gradient for "Confirmar recepción" etc.
 *   - outline    → bordered transparent background
 *   - ghost      → invisible until hover, for icon buttons / table actions
 *   - glass      → translucent with backdrop blur (login / hero CTAs)
 *   - link       → text-only, looks like a link
 *
 * Backward-compat: the deprecated `default` variant aliases to `primary`.
 *
 * A11y / interaction:
 *   - `isLoading` adds `aria-busy="true"` + Loader2 spinner; button is disabled
 *   - Touch targets: sm ≥ 40px, md/lg ≥ 44px, icon = 44px square (Apple HIG)
 *   - Focus ring uses global `focus-visible` ring tokens
 *   - Animations respect `prefers-reduced-motion` via Tailwind's `motion-safe:`
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type VarianteBoton =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'ghost'
  | 'outline'
  | 'glass'
  | 'link';

export type TamanoBoton = 'sm' | 'md' | 'lg' | 'icon' | 'iconSm';

interface PropiedadesBoton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VarianteBoton;
  size?: TamanoBoton;
  isLoading?: boolean;
  /** Optional left icon (lucide). */
  leftIcon?: React.ReactNode;
  /** Optional right icon (lucide). */
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<VarianteBoton, string> = {
  default: '', // alias for primary (resolved at runtime)

  primary: [
    'bg-gradient-to-br from-brand-500 to-brand-600 text-white',
    'shadow-soft-md shadow-brand-500/20',
    'hover:from-brand-600 hover:to-brand-700 hover:shadow-soft-lg hover:shadow-brand-500/30',
    'focus-visible:ring-brand-500/50',
    'dark:from-brand-600 dark:to-brand-700',
  ].join(' '),

  secondary: [
    'bg-muted text-foreground ring-1 ring-border',
    'shadow-soft-sm',
    'hover:bg-muted/80',
    'focus-visible:ring-ring',
  ].join(' '),

  danger: [
    'bg-gradient-to-br from-danger to-rose-700 text-danger-foreground',
    'shadow-soft-md shadow-danger/20',
    'hover:from-rose-700 hover:to-rose-800 hover:shadow-soft-lg',
    'focus-visible:ring-danger/50',
  ].join(' '),

  success: [
    'bg-gradient-to-br from-success to-emerald-700 text-success-foreground',
    'shadow-soft-md shadow-success/20',
    'hover:from-emerald-700 hover:to-emerald-800 hover:shadow-soft-lg',
    'focus-visible:ring-success/50',
  ].join(' '),

  ghost: [
    'bg-transparent text-foreground',
    'hover:bg-muted',
    'focus-visible:ring-ring',
  ].join(' '),

  outline: [
    'bg-card text-foreground ring-1 ring-border',
    'shadow-soft-sm',
    'hover:bg-muted hover:ring-border',
    'focus-visible:ring-ring',
  ].join(' '),

  glass: [
    'bg-white/30 text-foreground backdrop-blur-xl ring-1 ring-white/40',
    'shadow-soft-md shadow-black/5',
    'hover:bg-white/40 hover:ring-white/60',
    'focus-visible:ring-brand-400/50',
    'dark:bg-white/10 dark:ring-white/20 dark:hover:bg-white/15',
  ].join(' '),

  link: [
    'bg-transparent text-primary',
    'underline-offset-4 hover:underline',
    'focus-visible:ring-ring',
    'h-auto px-0 py-0',
  ].join(' '),
};

const sizeClasses: Record<TamanoBoton, string> = {
  sm: 'h-10 px-3 text-sm rounded-md gap-1.5',          // 40px — Apple HIG para acciones inline
  md: 'h-11 px-4 text-sm rounded-lg gap-2',              // 44px touch target
  lg: 'h-12 px-6 text-base rounded-lg gap-2',            // 48px
  icon: 'h-11 w-11 rounded-md',                          // 44px square — Apple HIG
  iconSm: 'h-9 w-9 rounded-md',                          // 36px — solo desktop cuando hay espacio
};

export function Boton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: PropiedadesBoton) {
  // Backward-compat alias: `default` → `primary`
  const effectiveVariant: VarianteBoton = variant === 'default' ? 'primary' : variant;
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        'group relative inline-flex items-center justify-center whitespace-nowrap font-semibold',
        'motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-60',
        // Press feedback (skip when loading to avoid scale conflicts)
        !isLoading && 'motion-safe:active:scale-[0.97]',
        variantClasses[effectiveVariant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : leftIcon ? (
        <span aria-hidden="true" className="inline-flex">{leftIcon}</span>
      ) : null}
      <span className="inline-flex items-center gap-2">{children}</span>
      {rightIcon && !isLoading ? (
        <span aria-hidden="true" className="inline-flex">{rightIcon}</span>
      ) : null}
    </button>
  );
}