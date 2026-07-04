/**
 * EstadoVacio — friendly zero-data placeholder.
 *
 * Replaces bare "<p>No hay pagos pendientes</p>" patterns with a visually clear
 * illustration (icon in soft circle), title, optional description, and CTA.
 *
 * Mobile-first: max-w-xs by default, scales up with `size="lg"`.
 */

import { isValidElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Type guard: is this a React element rather than an AccionEstadoVacio config? */
function isEmptyStateAction(
  value: AccionEstadoVacio | React.ReactNode,
): value is AccionEstadoVacio {
  return !isValidElement(value) && typeof value === 'object' && value !== null;
}

/**
 * Action slot for EstadoVacio. Either:
 *   - Pass a pre-styled React element (typically the imported Boton component).
 *   - Pass a simple { label, onClick } config and a default button is rendered.
 */
export interface AccionEstadoVacio {
  /** Text label for the default button. Ignored if `button` is provided. */
  label?: string;
  /** Click handler for the default button. */
  onClick?: () => void;
  /** A fully styled React element (e.g. the project's Boton) rendered as CTA. */
  button?: React.ReactNode;
}

export interface PropiedadesEstadoVacio {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: AccionEstadoVacio | React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: {
    wrapper: 'py-6',
    circle: 'h-10 w-10',
    icon: 'h-5 w-5',
    title: 'text-sm',
    desc: 'text-xs',
  },
  md: {
    wrapper: 'py-10',
    circle: 'h-14 w-14',
    icon: 'h-7 w-7',
    title: 'text-base',
    desc: 'text-sm',
  },
  lg: {
    wrapper: 'py-16',
    circle: 'h-20 w-20',
    icon: 'h-10 w-10',
    title: 'text-lg',
    desc: 'text-base',
  },
} as const;

export function EstadoVacio({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: PropiedadesEstadoVacio) {
  const s = sizeMap[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'px-4',
        s.wrapper,
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'mb-3 flex items-center justify-center rounded-full',
          'bg-muted text-muted-foreground ring-1 ring-border',
          s.circle,
        )}
      >
        <Icon className={s.icon} />
      </div>
      <h3 className={cn('font-semibold text-foreground', s.title)}>{title}</h3>
      {description ? (
        <p className={cn('mt-1 max-w-xs text-muted-foreground', s.desc)}>{description}</p>
      ) : null}
      {action ? (
        <div className="mt-4">
          {(() => {
            // 1) Raw React element passed directly (preferred path)
            if (!isEmptyStateAction(action)) return action as React.ReactNode;
            // 2) Pre-styled element via action.button
            if (action.button) return action.button;
            // 3) Default button
            return (
              <button
                type="button"
                onClick={action.onClick}
                className={cn(
                  'inline-flex h-9 items-center justify-center rounded-md px-4',
                  'bg-primary text-primary-foreground text-sm font-medium',
                  'hover:bg-primary/90 transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              >
                {action.label}
              </button>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}