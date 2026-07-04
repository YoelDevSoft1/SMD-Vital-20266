/**
 * TarjetaEstadistica — KPI tile for dashboards.
 *
 * Replaces the divergent `DashboardStatCard` and ad-hoc `SummaryCard` patterns
 * that lived in BillingDashboard/MyEarnings. Mobile-first: stacks value below
 * label on xs screens, scales to 4-up on desktop.
 *
 * Props:
 *   - `loading`: shows a pulsing skeleton and hides the value (skeleton-preserves layout → no CLS).
 *   - `change`: optional trend indicator (up/down/flat) with optional delta value.
 */

import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ColorTarjetaEstadistica = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface PropiedadesTarjetaEstadistica {
  label: string;
  value: string;
  /** Sub-caption below the value (e.g. "32 pagos · a 5 destinatarios"). */
  hint?: string;
  /** Optional trend indicator. */
  change?: { value: string; trend: 'up' | 'down' | 'flat' };
  icon?: LucideIcon;
  color?: ColorTarjetaEstadistica;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorBg: Record<ColorTarjetaEstadistica, string> = {
  brand:  'bg-brand-50 text-brand-700 ring-brand-200/60 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30',
  success:'bg-success-muted text-success ring-success/20',
  warning:'bg-warning-muted text-warning ring-warning/20',
  danger: 'bg-danger-muted text-danger ring-danger/20',
  info:   'bg-info-muted text-info ring-info/20',
  neutral:'bg-muted text-muted-foreground ring-border',
};

export function TarjetaEstadistica({
  label,
  value,
  hint,
  change,
  icon: Icon,
  color = 'brand',
  loading = false,
  onClick,
  className,
}: PropiedadesTarjetaEstadistica) {
  const interactive = typeof onClick === 'function';

  const TrendIcon =
    change?.trend === 'up' ? ArrowUp : change?.trend === 'down' ? ArrowDown : Minus;
  const trendColor =
    change?.trend === 'up'
      ? 'text-success'
      : change?.trend === 'down'
        ? 'text-danger'
        : 'text-muted-foreground';

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5',
        'shadow-soft-sm transition-all duration-150',
        interactive &&
          'cursor-pointer hover:border-brand-300 hover:shadow-soft-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <div
              aria-hidden="true"
              className="mt-2 h-7 w-24 animate-pulse rounded-md bg-muted"
            />
          ) : (
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {value}
            </p>
          )}
        </div>
        {Icon ? (
          <div
            aria-hidden="true"
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ring-1 sm:h-10 sm:w-10',
              colorBg[color],
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        ) : null}
      </div>

      {(hint || change) && !loading ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {change ? (
            <span className={cn('inline-flex items-center gap-1 font-medium', trendColor)}>
              <TrendIcon className="h-3 w-3" aria-hidden="true" />
              {change.value}
            </span>
          ) : null}
          {hint ? <span>{hint}</span> : null}
        </div>
      ) : null}
    </div>
  );
}