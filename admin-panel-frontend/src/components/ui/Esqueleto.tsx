/**
 * Esqueleto — loading placeholders that match the real layout.
 *
 * Skeletons feel native because:
 *   - They preview the structure of incoming content
 *   - No layout shift when the real content arrives (CLS = 0)
 *   - Subtle pulse/shimmer, never aggressive
 *
 * The `shimmer` keyframe is declared in tailwind.config.js (`animate-shimmer`)
 * — no more runtime DOM style injection.
 *
 * Usage:
 *   <Esqueleto className="h-4 w-32" />           // basic block
 *   <EsqueletoCirculo className="h-10 w-10" />    // avatar
 *   <EsqueletoFilaTabla />                        // row in a list
 *   <EsqueletoTarjetaEstadistica />                        // KPI tile
 */

import { cn } from '@/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Esqueleto({ className, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn(
        'relative overflow-hidden rounded-md bg-muted',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-shimmer before:bg-gradient-to-r',
        'before:from-transparent before:via-white/60 before:to-transparent',
        'dark:before:via-white/10',
        className,
      )}
      {...props}
    />
  );
}

export function EsqueletoCirculo({ className, ...props }: SkeletonProps) {
  return <Esqueleto className={cn('rounded-full', className)} {...props} />;
}

export function EsqueletoTexto({ className, ...props }: SkeletonProps) {
  return <Esqueleto className={cn('h-3 w-full', className)} {...props} />;
}

/* ============================================================
   COMPOSED SKELETONS — page-section placeholders
   ============================================================ */

/** Row in a card-list: avatar + 2 lines + action */
export function EsqueletoFilaTabla({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <EsqueletoCirculo className="h-10 w-10 flex-shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Esqueleto className="h-4 w-1/3" />
        <Esqueleto className="h-3 w-1/2" />
      </div>
      {columns > 2 ? (
        <div className="hidden gap-2 sm:flex">
          {Array.from({ length: columns - 2 }).map((_, i) => (
            <Esqueleto key={i} className="h-4 w-16" />
          ))}
        </div>
      ) : null}
      <Esqueleto className="h-8 w-8 flex-shrink-0 rounded-md" />
    </div>
  );
}

/** KPI tile placeholder */
export function EsqueletoTarjetaEstadistica() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Esqueleto className="h-3 w-24" />
          <Esqueleto className="h-7 w-32" />
        </div>
        <EsqueletoCirculo className="h-10 w-10" />
      </div>
      <Esqueleto className="mt-3 h-3 w-20" />
    </div>
  );
}

/** Tarjeta with optional image + title + 2 lines */
export function EsqueletoTarjeta({ hasImage = false }: { hasImage?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {hasImage ? <Esqueleto className="mb-4 h-40 w-full rounded-lg" /> : null}
      <div className="space-y-3">
        <Esqueleto className="h-4 w-3/4" />
        <Esqueleto className="h-3 w-full" />
        <Esqueleto className="h-3 w-5/6" />
      </div>
    </div>
  );
}

/** Single list item: avatar + 2 lines + value/right column */
export function EsqueletoElementoLista() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <EsqueletoCirculo className="h-10 w-10 flex-shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Esqueleto className="h-4 w-2/5" />
        <Esqueleto className="h-3 w-3/5" />
      </div>
      <div className="space-y-1.5 text-right">
        <Esqueleto className="ml-auto h-4 w-16" />
        <Esqueleto className="ml-auto h-3 w-12" />
      </div>
    </div>
  );
}

/** Page header placeholder (title + subtitle) */
export function EsqueletoEncabezado() {
  return (
    <div className="space-y-2 pb-2">
      <Esqueleto className="h-7 w-48" />
      <Esqueleto className="h-4 w-72" />
    </div>
  );
}

/** Full table placeholder with N rows */
export function EsqueletoTabla({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Esqueleto key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <EsqueletoFilaTabla key={i} columns={columns} />
      ))}
    </div>
  );
}

/** Grid of stat tiles (dashboards) */
export function EsqueletoCuadriculaEstadisticas({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <EsqueletoTarjetaEstadistica key={i} />
      ))}
    </div>
  );
}

/** Vertical list of items */
export function EsqueletoLista({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <EsqueletoElementoLista key={i} />
      ))}
    </div>
  );
}