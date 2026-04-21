const TZ = 'America/Bogota';

export function formatDateTime(dateString: string | Date): string {
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

export function formatDate(dateString: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function formatTime(dateString: string | Date): string {
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
