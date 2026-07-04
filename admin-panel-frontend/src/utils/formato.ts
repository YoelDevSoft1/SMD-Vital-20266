/**
 * Locale-aware formatters for SMD-Vital.
 *
 * All formatters default to es-CO + America/Bogota. Use these instead of
 * `toLocaleString(...)` inline so we have a single source of truth for the
 * Colombian Spanish / COP formatting used across billing, dates and times.
 *
 * Why a dedicated module?
 *   - The billing pages had `cop()` duplicated 3 times. Now one import.
 *   - Tests/screenshots stay stable when we change formatting.
 *   - SSR-friendly: imports are pure, no DOM access.
 */

const LOCALE = 'es-CO';
const TIMEZONE = 'America/Bogota';

const copFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const copWithCentsFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateShortFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: TIMEZONE,
});

const dateLongFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: TIMEZONE,
});

const dateNumericFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: TIMEZONE,
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIMEZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIMEZONE,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

/**
 * Format a numeric amount as Colombian Pesos.
 *
 *   formatearCOP(1500000)                   // "$ 1.500.000"
 *   formatearCOP(1500000, { withCents: true }) // "$ 1.500.000,00"
 *   formatearCOP(0)                          // "$ 0"
 *   formatearCOP(null)                       // "—"
 */
export function formatearCOP(
  n: number | null | undefined,
  options: { withCents?: boolean; fallback?: string } = {},
): string {
  if (n === null || n === undefined || Number.isNaN(n)) {
    return options.fallback ?? '—';
  }
  const formatter = options.withCents ? copWithCentsFormatter : copFormatter;
  return formatter.format(n);
}

/**
 * Short date: "15 ene 2026"
 */
export function formatearFecha(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return dateShortFormatter.format(d);
}

/**
 * Long date: "15 de enero de 2026"
 */
export function formatearFechaLarga(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return dateLongFormatter.format(d);
}

/**
 * Numeric date: "15/01/2026"
 */
export function formatearFechaNumerica(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return dateNumericFormatter.format(d);
}

/**
 * 24h time: "14:30"
 */
export function formatearHora(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return timeFormatter.format(d);
}

/**
 * Date + time: "15 ene 2026, 14:30"
 */
export function formatearFechaHora(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return dateTimeFormatter.format(d);
}

/**
 * Human-friendly relative time. Examples:
 *   "hace 5 min", "hace 2 h", "ayer", "hace 3 días", "15 ene"
 *
 * Falls back to short date for anything > 7 days.
 */
export function formatearRelativo(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  const diffH = Math.round(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'justo ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffH < 6) return `hace ${diffH} h`;
  if (diffD === 0) return 'hoy';
  if (diffD === 1) return 'ayer';
  if (diffD < 7) return `hace ${diffD} días`;
  return formatearFecha(d);
}

/**
 * Locale-aware integer formatting: 1500000 -> "1.500.000"
 */
export function formatearNumero(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return numberFormatter.format(n);
}

/**
 * Compact representation for KPI tiles:
 *   formatearCompacto(1500)        -> "1.5 K"
 *   formatearCompacto(2_500_000)   -> "2.5 M"
 */
export function formatearCompacto(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (Math.abs(n) < 1_000) return n.toString();
  if (Math.abs(n) < 1_000_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)} K`;
  if (Math.abs(n) < 1_000_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)} M`;
  return `${(n / 1_000_000_000).toFixed(1)} B`;
}

/**
 * Initials for avatar fallback: "María Pérez" -> "MP", "Juan" -> "JU"
 */
export function inicialesDeNombre(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}