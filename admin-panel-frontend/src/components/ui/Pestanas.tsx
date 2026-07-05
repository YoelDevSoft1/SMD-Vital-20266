/**
 * Pestanas — accessible tab navigation.
 *
 * Built on the WAI-ARIA tabs pattern: role="tablist" → role="tab" + aria-selected →
 * role="tabpanel" with aria-labelledby. Keyboard: ← → Home End to cycle,
 * Tab moves focus into the panel.
 *
 * Two visual styles:
 *   - "underline" (default) → underline indicator animated with transform (no layout shift)
 *   - "pills" → filled background per tab
 *
 * The sliding indicator is positioned via CSS variables updated on selection —
 * no width animations, fully transform-based (60fps).
 */

import {
  Children,
  isValidElement,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useId,
  useRef,
  useState,
  useEffect,
} from 'react';
import { cn } from '@/utils/cn';

export interface PropiedadesElementoPestana {
  value: string;
  etiqueta: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface PropiedadesPestanas {
  value: string;
  onValueChange: (value: string) => void;
  items: PropiedadesElementoPestana[];
  variant?: 'underline' | 'pills';
  ariaLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function Pestanas({
  value,
  onValueChange,
  items,
  variant = 'underline',
  ariaLabel,
  className,
  children,
}: PropiedadesPestanas) {
  const baseId = useId().replace(/:/g, '');
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number; top: number; height: number } | null>(null);

  const updateIndicator = useCallback(() => {
    if (variant !== 'underline') return;
    const activeTab = tabRefs.current.get(value);
    const list = listRef.current;
    if (!activeTab || !list) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - listRect.left + list.scrollLeft,
      width: tabRect.width,
      top: tabRect.top - listRect.top + list.scrollTop,
      height: tabRect.height,
    });
  }, [value, variant]);

  useEffect(() => {
    updateIndicator();
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(updateIndicator);
    ro.observe(list);
    window.addEventListener('resize', updateIndicator);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabledItems = items.filter((i) => !i.disabled);
    const currentIdx = enabledItems.findIndex((i) => i.value === value);
    if (currentIdx === -1) return;

    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % enabledItems.length;
    else if (e.key === 'ArrowLeft') nextIdx = (currentIdx - 1 + enabledItems.length) % enabledItems.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = enabledItems.length - 1;
    else return;

    e.preventDefault();
    const next = enabledItems[nextIdx]!;
    onValueChange(next.value);
    tabRefs.current.get(next.value)?.focus();
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel ?? 'Pestañas'}
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex max-w-full items-center gap-1 overflow-x-auto',
          variant === 'underline'
            ? 'border-b border-border'
            : 'rounded-lg bg-muted p-1 ring-1 ring-border',
        )}
      >
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <button
              key={item.value}
              ref={(el) => {
                if (el) tabRefs.current.set(item.value, el);
                else tabRefs.current.delete(item.value);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => !item.disabled && onValueChange(item.value)}
              className={cn(
                'relative inline-flex h-11 flex-shrink-0 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition-colors sm:h-10',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                variant === 'underline' && (selected
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'),
                variant === 'pills' && (selected
                  ? 'bg-card text-foreground shadow-soft-sm'
                  : 'text-muted-foreground hover:text-foreground'),
                item.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {item.icon}
              {item.etiqueta}
              {item.badge}
            </button>
          );
        })}
        {variant === 'underline' && indicator ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-primary transition-[transform,width] duration-200 ease-out"
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: indicator.width,
            }}
          />
        ) : null}
      </div>
      {children
        ? Children.map(children, (child) => {
            if (!isValidElement(child)) return null;
            // Match by id; render only the active panel.
            return child;
          })
        : null}
    </div>
  );
}

/**
 * PanelPestana — pairs with <Pestanas>. Render inside children of Pestanas.
 */
export interface PropiedadesPanelPestana {
  value: string;
  activeValue: string;
  baseId: string;
  className?: string;
  children: ReactNode;
}

export function PanelPestana({ value, activeValue, baseId, className, children }: PropiedadesPanelPestana) {
  if (value !== activeValue) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn('animate-fade-in pt-4 focus:outline-none', className)}
    >
      {children}
    </div>
  );
}