/**
 * margins.service.ts
 *
 * Servicio central para cálculo y gestión de márgenes.
 *
 * Responsabilidades:
 *  1. computeSnapshot(appointment) — Toma la regla activa del servicio,
 *     los actores (profesional, agente) y produce un MarginSnapshot inmutable.
 *  2. validateRule(amounts) — Valida que los 3 montos sumen al totalPrice
 *     y que sean >= 0.
 *  3. generateAcknowledgements(snapshot) — Al completar la cita, crea los
 *     2 acknowledgements (profesional + agente). SMD Vital no necesita ack
 *     porque la plata no sale de la empresa.
 *
 * Principio senior: el snapshot es INMUTABLE. Aunque cambien las reglas
 * del servicio después, las citas pasadas conservan el split original.
 * Esto salva en auditoría y en disputas.
 */

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface MarginAmounts {
  professionalAmount: number;
  agentAmount: number;
  smdVitalAmount: number;
}

export interface SnapshotInput {
  appointmentId: string;
  totalPrice: number;
  professionalId: string | null;
  professionalRole: UserRole | null;
  agentId: string | null;
  serviceId: string;
}

export interface SnapshotResult {
  ok: boolean;
  snapshotId?: string;
  error?: string;
}

export class MarginsService {
  /**
   * Toma la regla activa del servicio, valida los actores y crea el snapshot.
   * Se llama al CONFIRMAR la cita (no antes — si la cita se cancela, no debe
   * quedar snapshot).
   */
  static async createSnapshot(input: SnapshotInput): Promise<SnapshotResult> {
    // 1) Buscar la regla activa
    const rule = await prisma.serviceMarginRule.findUnique({
      where: { serviceId: input.serviceId },
    });

    if (!rule || !rule.isActive) {
      return { ok: false, error: `No hay regla de margen activa para el servicio ${input.serviceId}` };
    }

    // 2) Verificar que los montos son consistentes con el PVP
    const sum =
      rule.professionalAmount + rule.agentAmount + rule.smdVitalAmount;
    if (sum !== input.totalPrice) {
      return {
        ok: false,
        error: `Inconsistencia: regla suma ${sum} pero cita tiene totalPrice ${input.totalPrice}`,
      };
    }

    // 3) Verificar que el rol del profesional coincide con el requerido
    if (input.professionalRole && input.professionalRole !== rule.requiredRole) {
      return {
        ok: false,
        error: `Rol incorrecto: el servicio requiere ${rule.requiredRole} pero se está asignando ${input.professionalRole}`,
      };
    }

    // 4) Verificar que el agente es AGENT (si está presente)
    if (input.agentId) {
      const agent = await prisma.user.findUnique({
        where: { id: input.agentId },
        select: { role: true, isActive: true },
      });
      if (!agent || !agent.isActive) {
        return { ok: false, error: 'Agente no existe o está inactivo' };
      }
      if (agent.role !== 'AGENT') {
        return { ok: false, error: 'El usuario no tiene rol AGENT' };
      }
    }

    // 5) Crear el snapshot
    const snapshot = await prisma.marginSnapshot.create({
      data: {
        appointmentId: input.appointmentId,
        totalPrice: input.totalPrice,
        professionalId: input.professionalId,
        professionalRole: input.professionalRole,
        professionalAmount: input.professionalId ? rule.professionalAmount : 0,
        agentId: input.agentId,
        agentRole: input.agentId ? 'AGENT' : null,
        agentAmount: input.agentId ? rule.agentAmount : 0,
        smdVitalAmount: rule.smdVitalAmount,
        appliedRuleId: rule.id,
        appliedRuleSnapshot: {
          ruleId: rule.id,
          serviceId: rule.serviceId,
          professionalAmount: rule.professionalAmount,
          agentAmount: rule.agentAmount,
          smdVitalAmount: rule.smdVitalAmount,
          requiredRole: rule.requiredRole,
          capturedAt: new Date().toISOString(),
        },
      },
    });

    return { ok: true, snapshotId: snapshot.id };
  }

  /**
   * Al completar la cita, genera los acknowledgements para los actores
   * que deben recibir pago:
   *  - Profesional (si fue asignado)
   *  - Agente (si agendó la cita)
   *  - SMD Vital no necesita ack (la plata no sale)
   *
   * Si el snapshot ya tiene acknowledgements, no los duplica.
   */
  static async generateAcknowledgements(appointmentId: string): Promise<{
    ok: boolean;
    created: number;
    error?: string;
  }> {
    const snapshot = await prisma.marginSnapshot.findUnique({
      where: { appointmentId },
      include: {
        appointment: true,
      },
    });

    if (!snapshot) {
      return { ok: false, created: 0, error: 'No hay snapshot para esta cita' };
    }

    // Verificar que no se han creado ya
    const existing = await prisma.paymentAcknowledgement.count({
      where: { appointmentId },
    });

    if (existing > 0) {
      return { ok: true, created: 0 };
    }

    const acks: Array<{
      appointmentId: string;
      recipientId: string;
      recipientRole: UserRole;
      amount: number;
      concept: string;
    }> = [];

    // Ack para el profesional
    if (snapshot.professionalId && snapshot.professionalAmount > 0) {
      acks.push({
        appointmentId,
        recipientId: snapshot.professionalId,
        recipientRole: snapshot.professionalRole || 'DOCTOR',
        amount: snapshot.professionalAmount,
        concept: 'Pago profesional por servicio',
      });
    }

    // Ack para el agente
    if (snapshot.agentId && snapshot.agentAmount > 0) {
      acks.push({
        appointmentId,
        recipientId: snapshot.agentId,
        recipientRole: 'AGENT',
        amount: snapshot.agentAmount,
        concept: 'Comisión por agendar servicio',
      });
    }

    if (acks.length === 0) {
      return { ok: true, created: 0 };
    }

    await prisma.paymentAcknowledgement.createMany({ data: acks });

    return { ok: true, created: acks.length };
  }

  /**
   * Valida que la suma de los 3 montos sea exacta al totalPrice.
   * Útil para endpoints de admin al crear/editar reglas.
   */
  static validateRule(
    totalPrice: number,
    amounts: MarginAmounts
  ): { ok: boolean; error?: string } {
    if (amounts.professionalAmount < 0) return { ok: false, error: 'professionalAmount no puede ser negativo' };
    if (amounts.agentAmount < 0) return { ok: false, error: 'agentAmount no puede ser negativo' };
    if (amounts.smdVitalAmount < 0) return { ok: false, error: 'smdVitalAmount no puede ser negativo' };
    const sum = amounts.professionalAmount + amounts.agentAmount + amounts.smdVitalAmount;
    if (sum !== totalPrice) {
      return { ok: false, error: `La suma (${sum}) no coincide con el totalPrice (${totalPrice})` };
    }
    return { ok: true };
  }

  /**
   * Calcula cuánto le deben a un profesional (suma de acks PENDING o PAID).
   * Usado en el dashboard del profesional.
   */
  static async getPendingForUser(userId: string) {
    const acks = await prisma.paymentAcknowledgement.findMany({
      where: {
        recipientId: userId,
        status: { in: ['PENDING', 'PAID'] },
      },
      include: {
        appointment: {
          include: {
            patient: { include: { user: { select: { firstName: true, lastName: true } } } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { appointment: { scheduledAt: 'desc' } },
    });

    const totals = {
      pending: 0,
      paid: 0,
      total: 0,
    };

    for (const ack of acks) {
      if (ack.status === 'PENDING') totals.pending += ack.amount;
      if (ack.status === 'PAID') totals.paid += ack.amount;
      totals.total += ack.amount;
    }

    return { acks, totals };
  }

  /**
   * Resumen financiero para SMD Vital (admin).
   * Devuelve cuánto se ha facturado, cuánto está pendiente de pagar,
   * cuánto se ha pagado pero falta confirmar.
   */
  static async getSmdVitalFinancials(periodStart?: Date, periodEnd?: Date) {
    const where: any = {};
    if (periodStart || periodEnd) {
      where.appointment = {
        scheduledAt: {
          ...(periodStart && { gte: periodStart }),
          ...(periodEnd && { lte: periodEnd }),
        },
      };
    }

    const [pending, paid, acknowledged, disputed] = await Promise.all([
      prisma.paymentAcknowledgement.aggregate({
        where: { ...where, status: 'PENDING', recipientRole: { in: ['DOCTOR', 'NURSE', 'AGENT'] } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.paymentAcknowledgement.aggregate({
        where: { ...where, status: 'PAID', recipientRole: { in: ['DOCTOR', 'NURSE', 'AGENT'] } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.paymentAcknowledgement.aggregate({
        where: { ...where, status: 'ACKNOWLEDGED', recipientRole: { in: ['DOCTOR', 'NURSE', 'AGENT'] } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.paymentAcknowledgement.aggregate({
        where: { ...where, status: 'DISPUTED' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      pending: { count: pending._count, amount: pending._sum.amount || 0 },
      paid: { count: paid._count, amount: paid._sum.amount || 0 },
      acknowledged: { count: acknowledged._count, amount: acknowledged._sum.amount || 0 },
      disputed: { count: disputed._count, amount: disputed._sum.amount || 0 },
    };
  }
}

export default MarginsService;
