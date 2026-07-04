/**
 * payouts.routes.ts
 *
 * Endpoints para liquidación agrupada:
 *   POST /api/v1/payouts/generate     — Genera un PayoutBatch a partir de acks PAID
 *   GET  /api/v1/payouts              — Lista batches (admin)
 *   GET  /api/v1/payouts/:id          — Detalle de un batch
 *   POST /api/v1/payouts/:id/approve  — Aprueba el batch
 *   POST /api/v1/payouts/:id/mark-paid — Marca como pagado al destinatario
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import prismaClient from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();
const prisma = prismaClient;

router.use(authMiddleware);

const generateSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  recipientIds: z.array(z.string()).optional(),
});

const markPaidSchema = z.object({
  reference: z.string().min(1, 'Comprobante de transferencia requerido'),
  notes: z.string().optional(),
});

/**
 * POST /generate
 * Genera batches de pago a partir de acks PAID en el período.
 */
router.post(
  '/generate',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = generateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten() });
        return;
      }
      const { periodStart, periodEnd, recipientIds } = parsed.data;
      const start = new Date(periodStart);
      const end = new Date(periodEnd);

      const acksWhere: Record<string, unknown> = {
        status: 'PAID',
        appointment: { scheduledAt: { gte: start, lte: end } },
        payoutItem: null,
      };
      if (recipientIds && recipientIds.length > 0) {
        acksWhere['recipientId'] = { in: recipientIds };
      }

      const acks = await prisma.paymentAcknowledgement.findMany({
        where: acksWhere,
        include: { recipient: { select: { id: true, firstName: true, lastName: true, role: true } } },
      });

      const byRecipient = new Map<string, typeof acks>();
      for (const ack of acks) {
        if (!byRecipient.has(ack.recipientId)) byRecipient.set(ack.recipientId, []);
        byRecipient.get(ack.recipientId)!.push(ack);
      }

      const batches = [];
      for (const [recipientId, recipientAcks] of byRecipient) {
        const total = recipientAcks.reduce((s, a) => s + a.amount, 0);
        const batch = await prisma.payoutBatch.create({
          data: {
            recipientId,
            periodStart: start,
            periodEnd: end,
            totalAmount: total,
            status: 'DRAFT',
            items: {
              create: recipientAcks.map((a) => ({ acknowledgementId: a.id })),
            },
          },
          include: {
            recipient: { select: { firstName: true, lastName: true, role: true } },
            items: { include: { acknowledgement: true } },
          },
        });
        batches.push(batch);
      }

      res.json({
        success: true,
        period: { start, end },
        batchesCreated: batches.length,
        totalAmount: batches.reduce((s, b) => s + b.totalAmount, 0),
        batches,
      });
    } catch (err) {
      logger.error('Error in /payouts/generate:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * GET /
 * Lista batches. Admin ve todos, profesional ve los suyos.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const where: Record<string, unknown> = {};
    const role = req.userRole;
    if (role === 'DOCTOR' || role === 'NURSE' || role === 'AGENT') {
      where['recipientId'] = req.userId;
    }
    const status = req.query['status'] as string | undefined;
    if (status) where['status'] = status;

    const batches = await prisma.payoutBatch.findMany({
      where,
      include: {
        recipient: { select: { firstName: true, lastName: true, role: true } },
        items: { include: { acknowledgement: true } },
      },
      orderBy: { periodEnd: 'desc' },
    });

    res.json({ success: true, count: batches.length, batches });
  } catch (err) {
    logger.error('Error in GET /payouts:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

/**
 * GET /:id
 * Detalle de un batch.
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const batch = await prisma.payoutBatch.findUnique({
      where: { id: req.params['id'] || '' },
      include: {
        recipient: { select: { firstName: true, lastName: true, role: true, email: true, phone: true } },
        items: {
          include: {
            acknowledgement: {
              include: {
                appointment: {
                  include: {
                    service: { select: { name: true } },
                    patient: { include: { user: { select: { firstName: true, lastName: true } } } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch no encontrado' });
      return;
    }
    const role = req.userRole;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && batch.recipientId !== req.userId) {
      res.status(403).json({ success: false, message: 'No autorizado' });
      return;
    }
    res.json({ success: true, batch });
  } catch (err) {
    logger.error('Error in GET /payouts/:id:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

/**
 * POST /:id/approve
 * Aprueba el batch (antes de pagar).
 */
router.post(
  '/:id/approve',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const batch = await prisma.payoutBatch.findUnique({ where: { id: req.params['id'] || '' } });
      if (!batch) {
        res.status(404).json({ success: false, message: 'Batch no encontrado' });
        return;
      }
      if (batch.status !== 'DRAFT') {
        res.status(400).json({ success: false, message: `Solo se puede aprobar un batch DRAFT (actual: ${batch.status})` });
        return;
      }

      const updated = await prisma.payoutBatch.update({
        where: { id: batch.id },
        data: {
          status: 'APPROVED',
          approvedById: req.userId || null,
          approvedAt: new Date(),
        },
      });
      res.json({ success: true, batch: updated });
    } catch (err) {
      logger.error('Error in /payouts/:id/approve:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * POST /:id/mark-paid
 * Marca el batch como pagado.
 */
router.post(
  '/:id/mark-paid',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = markPaidSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten() });
        return;
      }

      const batch = await prisma.payoutBatch.findUnique({ where: { id: req.params['id'] || '' } });
      if (!batch) {
        res.status(404).json({ success: false, message: 'Batch no encontrado' });
        return;
      }
      if (batch.status !== 'APPROVED') {
        res.status(400).json({ success: false, message: `Solo se puede marcar como pagado un batch APPROVED (actual: ${batch.status})` });
        return;
      }

      const updated = await prisma.payoutBatch.update({
        where: { id: batch.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          reference: parsed.data.reference,
          ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
        },
      });
      res.json({ success: true, batch: updated });
    } catch (err) {
      logger.error('Error in /payouts/:id/mark-paid:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

export default router;
