const TZ = 'America/Bogota';

export function formatearFechaHora(dateString: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString));
}

export function formatearFecha(dateString: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function formatearHora(dateString: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString));
}

/** Convierte un datetime-local value ("2026-04-21T15:30") a ISO con offset Colombia */
export function localInputToColombiaISO(datetimeLocalValue: string): string {
  if (!datetimeLocalValue) return '';
  return `${datetimeLocalValue}:00-05:00`;
}

/** Convierte una fecha UTC del backend al valor para datetime-local input en hora Colombia */
export function utcToColombiaInputValue(utcDateString: string): string {
  if (!utcDateString) return '';
  const date = new Date(utcDateString);
  // Ajustar a UTC-5
  const colombiaOffset = -5 * 60;
  const localOffset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() + (localOffset + colombiaOffset) * 60000);
  return adjusted.toISOString().slice(0, 16);
}

/**
 * Etiqueta humana para un día cercano: "Hoy", "Mañana", "Mar 8 jul"
 * @param dateOffset 0=hoy, 1=mañana, etc.
 */
export function etiquetaCortaFecha(dateOffset: number): string {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + dateOffset);
  if (dateOffset === 0) return 'Hoy';
  if (dateOffset === 1) return 'Mañana';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(base);
}

/** Devuelve los próximos N días como strings 'YYYY-MM-DD' en hora local. */
export function obtenerProximosDias(cantidad = 7): Array<{ value: string; etiqueta: string }> {
  const out: Array<{ value: string; etiqueta: string }> = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ value: ymd, etiqueta: etiquetaCortaFecha(i) });
  }
  return out;
}
