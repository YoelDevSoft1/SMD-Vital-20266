/**
 * Paginacion — accessible pager for list pages.
 *
 * Replaces the inline pagination that lived in Users.tsx. Mobile-friendly:
 * on viewports < sm, collapses to "Anterior · 3/12 · Siguiente" to save space.
 *
 * Accessibility:
 *   - Wrapped in <nav aria-label="Paginación">
 *   - Current page has aria-current="page"
 *   - Disabled prev/next buttons have aria-disabled
 */

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PropiedadesPaginacion {
  page: number;          // 1-indexed
  totalPages: number;
  onPageChange: (page: number) => void;
  /** How many siblings around the current page. Default 1 → "... 4 5 [6] 7 8 ..." */
  siblings?: number;
  className?: string;
}

/** Build the page list with ellipsis markers. */
function buildPageList(current: number, total: number, siblings: number): Array<number | 'ellipsis'> {
  const totalNumbers = siblings * 2 + 5; // first, last, current, 2*siblings, 2 ellipsis
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  const pages: Array<number | 'ellipsis'> = [1];

  if (showLeftDots) pages.push('ellipsis');
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== total) pages.push(i);
  }
  if (showRightDots) pages.push('ellipsis');

  if (total > 1) pages.push(total);

  return pages;
}

export function Paginacion({
  page,
  totalPages,
  onPageChange,
  siblings = 1,
  className,
}: PropiedadesPaginacion) {
  if (totalPages <= 1) return null;
  const pages = buildPageList(page, totalPages, siblings);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const baseBtn =
    'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

  return (
    <nav
      aria-label="Paginación"
      className={cn('flex items-center justify-between gap-2', className)}
    >
      <button
        type="button"
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        aria-disabled={!canPrev}
        aria-label="Página anterior"
        className={cn(
          baseBtn,
          'gap-1 px-3 sm:w-auto',
          'text-muted-foreground hover:bg-muted hover:text-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
        )}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Mobile compact indicator */}
      <span className="text-sm tabular-nums text-muted-foreground sm:hidden">
        <span className="font-semibold text-foreground">{page}</span> / {totalPages}
      </span>

      {/* Desktop page list */}
      <ul className="hidden items-center gap-1 sm:flex">
        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <li
              key={`e-${idx}`}
              aria-hidden="true"
              className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Ir a la página ${p}`}
                className={cn(
                  baseBtn,
                  p === page
                    ? 'bg-primary text-primary-foreground shadow-soft-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        aria-disabled={!canNext}
        aria-label="Página siguiente"
        className={cn(
          baseBtn,
          'gap-1 px-3 sm:w-auto',
          'text-muted-foreground hover:bg-muted hover:text-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
        )}
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}