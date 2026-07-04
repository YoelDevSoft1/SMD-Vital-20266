/**
 * acknowledgements.routes.ts
 *
 * Endpoints para gestión de PaymentAcknowledgements:
 *   GET  /api/v1/acknowledgements/mine              — Mis acks pendientes
 *   POST /api/v1/acknowledgements/:id/pay           — Admin marca como pagado
 *   POST /api/v1/acknowledgements/:id/acknowledge   — Receptor confirma recepción
 *   POST /api/v1/acknowledgements/:id/dispute       — Receptor dice que NO recibió
 *   GET  /api/v1/acknowledgements/by-status/:status — Lista por estado (admin)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import prismaClient from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();
const prisma = prismaClient;

router.use(authMiddleware);

const paySchema = z.object({
  paymentProof: z.string().url().optional(),
  reference: z.string().optional(),
});

const disputeSchema = z.object({
  reason: z.string().min(5, 'Explica el motivo (mín 5 caracteres)'),
});

/**
 * GET /mine
 * Lista los acks del usuario actual (profesional/agente).
 * Filtros: ?status=PENDING|PAID|ACKNOWLEDGED|DISPUTED
 */
router.get('/mine', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const status = req.query['status'] as string | undefined;
    const where: Record<string, unknown> = { recipientId: userId };
    if (status) where['status'] = status;

    const acks = await prisma.paymentAcknowledgement.findMany({
      where,
      include: {
        appointment: {
          include: {
            patient: { include: { user: { select: { firstName: true, lastName: true } } } },
            service: { select: { name: true } },
            doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { appointment: { scheduledAt: 'desc' } },
    });

    const totals: Record<string, number> = {
      PENDING: 0,
      PAID: 0,
      ACKNOWLEDGED: 0,
      DISPUTED: 0,
      total: 0,
    };
    for (const a of acks) {
      const key = a.status as string;
      if (key in totals) {
        totals[key] = (totals[key] || 0) + a.amount;
      }
      totals['total'] = (totals['total'] || 0) + a.amount;
    }

    res.json({ success: true, count: acks.length, totals, acknowledgements: acks });
  } catch (err) {
    logger.error('Error in /acknowledgements/mine:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

/**
 * GET /by-status/:status
 * Para el cierre financiero del admin.
 */
router.get(
  '/by-status/:status',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const status = req.params['status'] || '';
      const validStatuses = ['PENDING', 'PAID', 'ACKNOWLEDGED', 'DISPUTED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, message: 'Status inválido' });
        return;
      }

      const where: Record<string, unknown> = { status };
      const from = req.query['from'] as string | undefined;
      const to = req.query['to'] as string | undefined;
      if (from || to) {
        const scheduledAt: Record<string, Date> = {};
        if (from) scheduledAt['gte'] = new Date(from);
        if (to) scheduledAt['lte'] = new Date(to);
        where['appointment'] = { scheduledAt };
      }

      const acks = await prisma.paymentAcknowledgement.findMany({
        where,
        include: {
          appointment: {
            include: {
              service: { select: { name: true } },
              patient: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
          },
          recipient: { select: { firstName: true, lastName: true, role: true } },
        },
        orderBy: { appointment: { scheduledAt: 'desc' } },
      });

      const total = acks.reduce((sum, a) => sum + a.amount, 0);
      res.json({ success: true, status, count: acks.length, total, acknowledgements: acks });
    } catch (err) {
      logger.error('Error in /acknowledgements/by-status:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * POST /:id/pay
 * Admin marca como PAGADO (transferencia hecha, falta que el receptor confirme).
 */
router.post(
  '/:id/pay',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = paySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten() });
        return;
      }

      const ack = await prisma.paymentAcknowledgement.findUnique({
        where: { id: req.params['id'] || '' },
      });
      if (!ack) {
        res.status(404).json({ success: false, message: 'Ack no encontrado' });
        return;
      }
      if (ack.status !== 'PENDING') {
        res.status(400).json({ success: false, message: `Solo se puede pagar un ack PENDING (actual: ${ack.status})` });
        return;
      }

      const updated = await prisma.paymentAcknowledgement.update({
        where: { id: ack.id },
        data: {
          status: 'PAID',
          paidById: req.userId || null,
          paidAt: new Date(),
          paymentProof: parsed.data.paymentProof || null,
        },
      });

      res.json({ success: true, acknowledgement: updated });
    } catch (err) {
      logger.error('Error in /acknowledgements/:id/pay:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * POST /:id/acknowledge
 * El receptor confirma que recibió el pago.
 */
router.post('/:id/acknowledge', async (req: Request, res: Response): Promise<void> => {
  try {
    const ack = await prisma.paymentAcknowledgement.findUnique({
      where: { id: req.params['id'] || '' },
    });
    if (!ack) {
      res.status(404).json({ success: false, message: 'Ack no encontrado' });
      return;
    }
    if (ack.recipientId !== req.userId) {
      res.status(403).json({ success: false, message: 'No autorizado' });
      return;
    }
    if (ack.status !== 'PAID') {
      res.status(400).json({ success: false, message: `Solo puedes confirmar un pago que ya fue marcado PAID (actual: ${ack.status})` });
      return;
    }

    const updated = await prisma.paymentAcknowledgement.update({
      where: { id: ack.id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
    });

    // Si TODOS los acks de esta cita están en ACKNOWLEDGED → cita RECONCILED
    const remaining = await prisma.paymentAcknowledgement.count({
      where: { appointmentId: ack.appointmentId, status: { not: 'ACKNOWLEDGED' } },
    });

    await prisma.appointment.update({
      where: { id: ack.appointmentId },
      data: { status: remaining === 0 ? 'RECONCILED' : 'PARTIALLY_RECONCILED' },
    });

    res.json({ success: true, acknowledgement: updated });
  } catch (err) {
    logger.error('Error in /acknowledgements/:id/acknowledge:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

/**
 * POST /:id/dispute
 * El receptor dice que NO recibió el pago (aún marcado PAID).
 */
router.post('/:id/dispute', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = disputeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const ack = await prisma.paymentAcknowledgement.findUnique({
      where: { id: req.params['id'] || '' },
    });
    if (!ack) {
      res.status(404).json({ success: false, message: 'Ack no encontrado' });
      return;
    }
    if (ack.recipientId !== req.userId) {
      res.status(403).json({ success: false, message: 'No autorizado' });
      return;
    }
    if (ack.status !== 'PAID') {
      res.status(400).json({ success: false, message: 'Solo puedes disputar un pago marcado PAID' });
      return;
    }

    const updated = await prisma.paymentAcknowledgement.update({
      where: { id: ack.id },
      data: {
        status: 'DISPUTED',
        disputedReason: parsed.data.reason,
      },
    });

    res.json({ success: true, acknowledgement: updated });
  } catch (err) {
    logger.error('Error in /acknowledgements/:id/dispute:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

export default router;
