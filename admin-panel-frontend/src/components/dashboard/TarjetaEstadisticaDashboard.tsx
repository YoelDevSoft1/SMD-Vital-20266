import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Tarjeta, TarjetaContenido } from '@/components/ui/Tarjeta';
import { cn } from '@/utils/cn';

type Acento = 'blue' | 'green' | 'purple' | 'indigo' | 'emerald' | 'amber';

interface PropiedadesTarjetaEstadistica {
  title: string;
  valor: string;
  icon: LucideIcon;
  acento?: Acento;
  change?: number;
  changeLabel?: string;
  hint?: string;
}

const estilosAcento: Record<Acento, { icon: string; chip: string }> = {
  blue:    { icon: 'bg-brand-500 text-white shadow-soft-md shadow-brand-500/20', chip: 'text-brand-700 dark:text-brand-300' },
  green:   { icon: 'bg-success text-white shadow-soft-md shadow-success/20',   chip: 'text-success' },
  purple:  { icon: 'bg-role-super text-white shadow-soft-md shadow-role-super/20', chip: 'text-role-super' },
  indigo:  { icon: 'bg-info text-white shadow-soft-md shadow-info/20',          chip: 'text-info' },
  emerald: { icon: 'bg-success text-white shadow-soft-md shadow-success/20',   chip: 'text-success' },
  amber:   { icon: 'bg-warning text-white shadow-soft-md shadow-warning/20',   chip: 'text-warning' },
};

export function TarjetaEstadisticaDashboard({
  title,
  valor,
  icon: Icono,
  acento = 'blue',
  change,
  changeLabel,
  hint,
}: PropiedadesTarjetaEstadistica) {
  const colorCambio =
    change === undefined
      ? 'text-muted-foreground'
      : change > 0
        ? 'text-success'
        : change < 0
          ? 'text-danger'
          : 'text-muted-foreground';
  const IconoCambio = change === undefined ? null : change > 0 ? ArrowUp : change < 0 ? ArrowDown : Minus;
  const estilos = estilosAcento[acento] ?? estilosAcento.blue;

  return (
    <Tarjeta
      variant="solid"
      interactive
      className="group transition-shadow hover:shadow-soft-lg"
    >
      <TarjetaContenido className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {valor}
            </p>
          </div>
          <div
            aria-hidden="true"
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
              'motion-safe:transition-transform motion-safe:duration-200',
              'group-hover:scale-110',
              estilos.icon,
            )}
          >
            <Icono className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </div>
        </div>

        {(change !== undefined || hint) ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {change !== undefined && IconoCambio ? (
              <span className={cn('inline-flex items-center gap-1 font-semibold', colorCambio)}>
                <IconoCambio className="h-3.5 w-3.5" aria-hidden="true" />
                {Math.abs(change).toFixed(1)}%
              </span>
            ) : null}
            {changeLabel ? (
              <span className="text-muted-foreground">{changeLabel}</span>
            ) : null}
            {hint ? (
              <span className={cn('ml-auto text-xs font-semibold', estilos.chip)}>
                {hint}
              </span>
            ) : null}
          </div>
        ) : null}
      </TarjetaContenido>
    </Tarjeta>
  );
}