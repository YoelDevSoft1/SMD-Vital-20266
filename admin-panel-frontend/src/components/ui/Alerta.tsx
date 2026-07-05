/**
 * Alerta — inline message for forms, lists, and connection issues.
 *
 * Variants map to status tokens. Accessibility:
 *   - `danger`/`warning` → role="alert" (interrupts screen reader)
 *   - `success`/`info`   → role="status" (polite announcement)
 *
 * Mobile-first: stretches full width, comfortable touch targets for dismiss.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export type VarianteAlerta = 'info' | 'success' | 'warning' | 'danger';

export interface PropiedadesAlerta {
  variant?: VarianteAlerta;
  title?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Render a custom icon instead of the default. */
  icon?: LucideIcon;
  /** Optional CTA rendered on the right (e.g. "Reintentar"). */
  action?: React.ReactNode;
  /** Show a dismiss (×) button; controlled externally via `onDismiss` if provided. */
  onDismiss?: () => void;
  /** Auto-dismiss after N ms. */
  autoHideMs?: number;
  className?: string;
}

const variantClasses: Record<VarianteAlerta, string> = {
  info:    'bg-info-muted text-info-muted-foreground ring-info/20 [&>svg]:text-info',
  success: 'bg-success-muted text-success-muted-foreground ring-success/20 [&>svg]:text-success',
  warning: 'bg-warning-muted text-warning-muted-foreground ring-warning/20 [&>svg]:text-warning',
  danger:  'bg-danger-muted text-danger-muted-foreground ring-danger/20 [&>svg]:text-danger',
};

const variantIcons: Record<VarianteAlerta, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

export function Alerta({
  variant = 'info',
  title,
  description,
  children,
  icon,
  action,
  onDismiss,
  autoHideMs,
  className,
}: PropiedadesAlerta) {
  const [visible, setVisible] = useState(true);
  const Icon = icon ?? variantIcons[variant];

  useEffect(() => {
    if (!autoHideMs) return;
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, onDismiss]);

  if (!visible) return null;

  const a11yRole = variant === 'danger' || variant === 'warning' ? 'alert' : 'status';
  const body = description ?? children;

  return (
    <div
      role={a11yRole}
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 ring-1',
        'text-sm',
        variantClasses[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {body ? (
          <div className={cn('text-foreground/80', title && 'mt-0.5')}>{body}</div>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          aria-label="Cerrar mensaje"
          className={cn(
            'inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md sm:h-9 sm:w-9',
            'text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}