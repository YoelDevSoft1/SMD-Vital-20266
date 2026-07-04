/**
 * GrupoFiltros — horizontal chip-based filter selector.
 *
 * Used to switch between status filters (PENDING / PAID / ACKNOWLEDGED) and
 * other categorical filter sets. Mobile-friendly: chips stay touch-friendly
 * (>=36px tall), overflow scrolls horizontally when narrow.
 *
 * Accessibility: uses role="radiogroup" + role="radio" with aria-checked so
 * screen readers announce filter state correctly.
 */

import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

export interface OpcionGrupoFiltros<V extends string = string> {
  value: V;
  label: string;
  count?: number;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface PropiedadesGrupoFiltros<V extends string = string> {
  options: ReadonlyArray<OpcionGrupoFiltros<V>>;
  value: V;
  onChange: (value: V) => void;
  /** "segmented" looks like a single rounded pill split in sections (default). */
  variant?: 'segmented' | 'pills';
  ariaLabel?: string;
  className?: string;
}

export function GrupoFiltros<V extends string = string>({
  options,
  value,
  onChange,
  variant = 'segmented',
  ariaLabel,
  className,
}: PropiedadesGrupoFiltros<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? 'Filtro'}
      className={cn(
        'inline-flex max-w-full overflow-x-auto rounded-lg p-0.5',
        variant === 'segmented'
          ? 'bg-muted ring-1 ring-border'
          : 'gap-1.5 bg-transparent ring-0',
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onChange(opt.value)}
            className={cn(
              'inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium',
              'whitespace-nowrap transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              variant === 'segmented' && selected
                ? 'bg-card text-foreground shadow-soft-sm'
                : 'text-muted-foreground hover:text-foreground',
              variant === 'pills' && selected
                ? 'bg-primary text-primary-foreground shadow-soft-sm'
                : null,
              variant === 'pills' && !selected
                ? 'bg-muted/60 text-muted-foreground hover:bg-muted'
                : null,
              opt.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {opt.label}
            {typeof opt.count === 'number' ? (
              <span
                className={cn(
                  'ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                  selected
                    ? variant === 'pills'
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary/10 text-primary'
                    : 'bg-muted-foreground/15 text-muted-foreground',
                )}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}