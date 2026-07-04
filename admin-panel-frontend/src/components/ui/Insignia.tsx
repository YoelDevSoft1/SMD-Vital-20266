/**
 * Insignia — semantic status indicator.
 *
 * Variants map directly to design system tokens (success, warning, danger, info,
 * neutral, default) and the role-* set. Use `dot` for a leading indicator dot;
 * pass an `icon` (Lucide) for richer context (e.g. status icons).
 *
 * Designed to be the only way we render status pills in the app — replaces the
 * dozens of inline `bg-{color}-50 text-{color}-700` patterns across pages.
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

export type VarianteInsignia =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'role-admin'
  | 'role-super'
  | 'role-doctor'
  | 'role-nurse'
  | 'role-patient'
  | 'role-agent';

export type TamanoInsignia = 'sm' | 'md' | 'lg';

export interface PropiedadesInsignia extends HTMLAttributes<HTMLSpanElement> {
  variant?: VarianteInsignia;
  size?: TamanoInsignia;
  /** Leading dot indicator. */
  dot?: boolean;
  /** Custom icon. Takes precedence over `dot`. */
  icon?: LucideIcon;
  /** Removes padding/icon for compact inline use. */
  children?: ReactNode;
}

const variantClasses: Record<VarianteInsignia, string> = {
  default: 'bg-muted text-foreground ring-1 ring-border',
  success: 'bg-success-muted text-success-muted-foreground ring-1 ring-success/20',
  warning: 'bg-warning-muted text-warning-muted-foreground ring-1 ring-warning/20',
  danger:  'bg-danger-muted  text-danger-muted-foreground  ring-1 ring-danger/20',
  info:    'bg-info-muted    text-info-muted-foreground    ring-1 ring-info/20',
  neutral: 'bg-neutral-muted text-neutral-muted-foreground ring-1 ring-neutral/20',

  'role-admin':   'bg-role-admin-muted   text-role-admin   ring-1 ring-role-admin/20',
  'role-super':   'bg-role-super-muted   text-role-super   ring-1 ring-role-super/20',
  'role-doctor':  'bg-role-doctor-muted  text-role-doctor  ring-1 ring-role-doctor/20',
  'role-nurse':   'bg-role-nurse-muted   text-role-nurse   ring-1 ring-role-nurse/20',
  'role-patient': 'bg-role-patient-muted text-role-patient ring-1 ring-role-patient/20',
  'role-agent':   'bg-role-agent-muted   text-role-agent   ring-1 ring-role-agent/20',
};

const dotColor: Record<VarianteInsignia, string> = {
  default: 'bg-foreground/60',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  info:    'bg-info',
  neutral: 'bg-neutral',
  'role-admin':   'bg-role-admin',
  'role-super':   'bg-role-super',
  'role-doctor':  'bg-role-doctor',
  'role-nurse':   'bg-role-nurse',
  'role-patient': 'bg-role-patient',
  'role-agent':   'bg-role-agent',
};

const sizeClasses: Record<TamanoInsignia, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
  lg: 'px-2.5 py-1 text-sm gap-1.5',
};

export function Insignia({
  variant = 'default',
  size = 'md',
  dot,
  icon: Icon,
  className,
  children,
  ...props
}: PropiedadesInsignia) {
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'transition-colors duration-150',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {Icon ? (
        <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden="true" />
      ) : dot ? (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 rounded-full', dotColor[variant])}
        />
      ) : null}
      {children}
    </span>
  );
}