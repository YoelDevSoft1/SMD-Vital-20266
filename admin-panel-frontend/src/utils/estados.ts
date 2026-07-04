/**
 * Status metadata — single source of truth for status colors, labels, and icons.
 *
 * Replaces the duplicated `statusColors` / `statusLabels` / inline `cn(...)` that
 * previously lived in BillingDashboard, MyEarnings and MyCommissions.
 *
 * Each entry maps a status enum to:
 *   - `variant`  → drives <Insignia variant={...}> directly
 *   - `etiqueta`    → human-readable Spanish label
 *   - `icon`     → lucide-react icon (optional)
 *   - `tone`     → "solid" | "soft" for badge background style
 *
 * Usage:
 *   <Insignia {...getStatusMeta('PAID', 'ack')}>...</Insignia>
 *   getStatusMeta(ack.status, 'ack').etiqueta
 */

import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  FileText,
  Send,
  XCircle,
  Timer,
  Hourglass,
  type LucideIcon,
} from 'lucide-react';

/** Insignia variant that aligns with the tokens defined in tailwind.config.js */
export type VarianteEstado =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'default';

export type TonoEstado = 'solid' | 'soft';

export interface MetaEstado {
  variant: VarianteEstado;
  etiqueta: string;
  icon?: LucideIcon;
  tone: TonoEstado;
}

/* ============================================================
   Acknowledgement status (Billing Core)
   ============================================================ */
export type EstadoAck =
  | 'PENDING'
  | 'PAID'
  | 'ACKNOWLEDGED'
  | 'DISPUTED'
  | 'CANCELLED';

export const META_ESTADOS_ACK: Record<EstadoAck, MetaEstado> = {
  PENDING:      { variant: 'warning', etiqueta: 'Por pagar',             icon: Clock,         tone: 'soft' },
  PAID:         { variant: 'info',    etiqueta: 'Pagado · por confirmar', icon: Send,          tone: 'soft' },
  ACKNOWLEDGED: { variant: 'success', etiqueta: 'Recibido',              icon: CheckCircle2,  tone: 'soft' },
  DISPUTED:     { variant: 'danger',  etiqueta: 'En disputa',            icon: AlertTriangle, tone: 'soft' },
  CANCELLED:    { variant: 'neutral', etiqueta: 'Cancelado',             icon: XCircle,       tone: 'soft' },
};

/* ============================================================
   PayoutBatch status (Billing Core)
   ============================================================ */
export type EstadoLotePago = 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';

export const META_ESTADOS_LOTE_PAGO: Record<EstadoLotePago, MetaEstado> = {
  DRAFT:    { variant: 'neutral', etiqueta: 'Borrador', icon: FileText,    tone: 'soft' },
  APPROVED: { variant: 'info',    etiqueta: 'Aprobado', icon: CheckCircle2, tone: 'soft' },
  PAID:     { variant: 'success', etiqueta: 'Pagado',   icon: CheckCircle2, tone: 'soft' },
  CANCELLED:{ variant: 'danger',  etiqueta: 'Cancelado',icon: XCircle,      tone: 'soft' },
};

/* ============================================================
   Appointment status
   ============================================================ */
export type ValorEstadoCita =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PARTIALLY_RECONCILED'
  | 'RECONCILED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export const META_ESTADOS_CITA: Record<ValorEstadoCita, MetaEstado> = {
  PENDING:               { variant: 'warning', etiqueta: 'Pendiente',    icon: Hourglass,     tone: 'soft' },
  CONFIRMED:             { variant: 'info',    etiqueta: 'Confirmada',   icon: CircleDot,     tone: 'soft' },
  IN_PROGRESS:           { variant: 'info',    etiqueta: 'En curso',     icon: Timer,         tone: 'soft' },
  COMPLETED:             { variant: 'success', etiqueta: 'Completada',   icon: CheckCircle2,  tone: 'soft' },
  PARTIALLY_RECONCILED:  { variant: 'warning', etiqueta: 'Reconciliando',icon: Hourglass,     tone: 'soft' },
  RECONCILED:            { variant: 'success', etiqueta: 'Reconciliada', icon: CheckCircle2,  tone: 'soft' },
  CANCELLED:             { variant: 'danger',  etiqueta: 'Cancelada',    icon: XCircle,       tone: 'soft' },
  NO_SHOW:               { variant: 'danger',  etiqueta: 'No asistió',   icon: AlertTriangle, tone: 'soft' },
  RESCHEDULED:           { variant: 'info',    etiqueta: 'Reprogramada', icon: Clock,         tone: 'soft' },
};

/* ============================================================
   Payment status
   ============================================================ */
export type ValorEstadoPago =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export const META_ESTADOS_PAGO: Record<ValorEstadoPago, MetaEstado> = {
  PENDING:   { variant: 'warning', etiqueta: 'Pendiente',  icon: Clock,         tone: 'soft' },
  COMPLETED: { variant: 'success', etiqueta: 'Completado', icon: CheckCircle2,  tone: 'soft' },
  FAILED:    { variant: 'danger',  etiqueta: 'Fallido',    icon: AlertTriangle, tone: 'soft' },
  REFUNDED:  { variant: 'neutral', etiqueta: 'Reembolsado',icon: Send,          tone: 'soft' },
  CANCELLED: { variant: 'neutral', etiqueta: 'Cancelado',  icon: XCircle,       tone: 'soft' },
};

/* ============================================================
   Helper: safe lookup with fallback
   ============================================================ */

export function obtenerMetaEstadoAck(status: string): MetaEstado {
  return (META_ESTADOS_ACK as Record<string, MetaEstado>)[status]
    ?? { variant: 'neutral', etiqueta: status, tone: 'soft' as const };
}

export function obtenerMetaEstadoLotePago(status: string): MetaEstado {
  return (META_ESTADOS_LOTE_PAGO as Record<string, MetaEstado>)[status]
    ?? { variant: 'neutral', etiqueta: status, tone: 'soft' as const };
}

export function obtenerMetaEstadoCita(status: string): MetaEstado {
  return (META_ESTADOS_CITA as Record<string, MetaEstado>)[status]
    ?? { variant: 'neutral', etiqueta: status, tone: 'soft' as const };
}

export function obtenerMetaEstadoPago(status: string): MetaEstado {
  return (META_ESTADOS_PAGO as Record<string, MetaEstado>)[status]
    ?? { variant: 'neutral', etiqueta: status, tone: 'soft' as const };
}

/* ============================================================
   Filter option sets (used by GrupoFiltros / Pestanas)
   ============================================================ */

export const OPCIONES_FILTRO_ESTADO_ACK = [
  { value: 'all',          label: 'Todos' },
  { value: 'PENDING',      label: 'Por pagar' },
  { value: 'PAID',         label: 'Por confirmar' },
  { value: 'ACKNOWLEDGED', label: 'Recibidos' },
] as const;