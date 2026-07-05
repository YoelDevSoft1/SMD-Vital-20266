/**
 * appointment.routes.ts
 *
 * Endpoints del flujo core de citas con billing:
 *   POST   /api/v1/appointments                  — Asesor agenda (genera snapshot al CONFIRMAR)
 *   GET    /api/v1/appointments                  — Lista citas (filtrada por rol)
 *   GET    /api/v1/appointments/:id              — Detalle
 *   POST   /api/v1/appointments/:id/confirm      — Pasa a CONFIRMED y genera snapshot
 *   POST   /api/v1/appointments/:id/start        — Profesional marca inicio
 *   POST   /api/v1/appointments/:id/complete     — Profesional marca fin + genera acks
 *   GET    /api/v1/appointments/available-slots  — Slots disponibles del profesional
 *
 * El snapshot se crea al CONFIRMAR (no al crear), porque si la cita se
 * cancela antes de confirmar no debe quedar registro contable.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import prismaClient from '../utils/prisma';
import { logger } from '../utils/logger';
import { MarginsService } from '../services/margins.service';

const router = Router();
const prisma = prismaClient;

router.use(authMiddleware);

// ============================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================

const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1, 'Se requiere un profesional (doctor o enfermera)'),
  serviceId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  notes: z.string().optional(),
});

const completeSchema = z.object({
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

const slotsQuerySchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const quickPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  documentId: z.string().min(1),
  phone: z.string().optional(),
});

// ============================================================
// HELPERS
// ============================================================

/**
 * Calcula los slots disponibles de un profesional para una fecha y servicio.
 */
async function findAvailableSlots(
  doctorId: string,
  serviceId: string,
  date: string
): Promise<{ start: string; end: string }[]> {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const specificAvailability = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      date: { gte: dayStart, lte: dayEnd },
      isActive: true,
    },
  });

  let windows: { start: string; end: string }[] = [];
  const dayOfWeek = dayStart.getDay();

  if (specificAvailability.length > 0) {
    windows = specificAvailability.map((a) => ({
      start: a.startTime,
      end: a.endTime,
    }));
  } else {
    const weekly = await prisma.doctorSchedule.findMany({
      where: { doctorId, dayOfWeek, isActive: true },
    });
    windows = weekly.map((s) => ({ start: s.startTime, end: s.endTime }));
  }

  if (windows.length === 0) return [];

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return [];
  const durationMin = service.duration;

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
    },
    select: { scheduledAt: true, duration: true },
  });

  const takenSlots = existingAppointments.map((a) => ({
    start: a.scheduledAt,
    duration: a.duration,
  }));

  const slots: { start: string; end: string }[] = [];
  const stepMin = 30;

  for (const win of windows) {
    const [sh, sm] = win.start.split(':').map(Number) as [number, number];
    const [eh, em] = win.end.split(':').map(Number) as [number, number];
    const winStartMin = sh * 60 + sm;
    const winEndMin = eh * 60 + em;

    for (let m = winStartMin; m + durationMin <= winEndMin; m += stepMin) {
      const slotStart = new Date(dayStart);
      slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60_000);

      const conflict = takenSlots.some((t) => {
        const tEnd = new Date(t.start.getTime() + t.duration * 60_000);
        return (
          (slotStart >= t.start && slotStart < tEnd) ||
          (slotEnd > t.start && slotEnd <= tEnd) ||
          (slotStart <= t.start && slotEnd >= tEnd)
        );
      });

      if (!conflict && slotStart > new Date()) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }
  }

  return slots;
}

function getServiceDedupKey(service: { name: string }): string {
  return service.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^c\.\s*/, 'control ')
    .replace(/^s\.\s*/, 'suero ')
    .replace(/\bresp\.\s*/g, 'respiratoria ')
    .replace(/\bresp\b/g, 'respiratoria')
    .replace(/\bde\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeServices<T extends { name: string; description?: string | null }>(services: T[]): T[] {
  const byKey = new Map<string, T>();

  for (const service of services) {
    const key = getServiceDedupKey(service);
    const current = byKey.get(key);

    if (!current) {
      byKey.set(key, service);
      continue;
    }

    const currentScore = (current.name.length + (current.description?.length ?? 0));
    const nextScore = (service.name.length + (service.description?.length ?? 0));
    if (nextScore > currentScore) {
      byKey.set(key, service);
    }
  }

  return Array.from(byKey.values()).sort((left, right) => left.name.localeCompare(right.name, 'es'));
}

// ============================================================
// ENDPOINTS
// ============================================================

/**
 * GET /api/v1/appointments/booking-options
 * Opciones mínimas para que el asesor pueda agendar sin entrar al panel admin.
 */
router.get(
  '/booking-options',
  requireRole(['AGENT', 'ADMIN', 'SUPER_ADMIN']),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const [professionals, services, patients] = await Promise.all([
        prisma.doctor.findMany({
          where: {
            isAvailable: true,
            user: {
              isActive: true,
              role: { in: ['DOCTOR', 'NURSE'] },
            },
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: { user: { firstName: 'asc' } },
          take: 200,
        }),
        prisma.service.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' },
          take: 200,
        }),
        prisma.patient.findMany({
          select: {
            id: true,
            address: true,
            city: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: { user: { firstName: 'asc' } },
          take: 300,
        }),
      ]);

      res.json({
        success: true,
        data: {
          doctors: professionals,
          services: dedupeServices(services),
          patients,
        },
      });
    } catch (err) {
      logger.error('Error in /appointments/booking-options:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * POST /api/v1/appointments/patients/quick
 * Creación rápida de paciente desde el flujo operativo del asesor.
 */
router.post(
  '/patients/quick',
  requireRole(['AGENT', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = quickPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten() });
        return;
      }

      const { firstName, lastName, documentId, phone } = parsed.data;
      const email = `paciente-${documentId}@smdvital.local`;

      const existingUser = await prisma.user.findFirst({
        where: {
          email,
        },
        include: { patient: true },
      });

      if (existingUser?.patient) {
        res.status(200).json({ success: true, data: existingUser.patient });
        return;
      }

      const patient = await prisma.patient.create({
        data: {
          user: {
            create: {
              firstName,
              lastName,
              email,
              phone: phone ?? null,
              role: 'PATIENT',
              isActive: true,
              isVerified: false,
              password: '',
            },
          },
        },
        include: { user: true },
      });

      res.status(201).json({ success: true, data: patient });
    } catch (err) {
      logger.error('Error in /appointments/patients/quick:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * GET /api/v1/appointments/available-slots
 * El asesor lo usa para ver huecos antes de agendar.
 */
router.get(
  '/available-slots',
  requireRole(['AGENT', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = slotsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten() });
        return;
      }
      const { doctorId, serviceId, date } = parsed.data;
      const slots = await findAvailableSlots(doctorId, serviceId, date);
      res.json({ success: true, date, doctorId, serviceId, slots });
    } catch (err) {
      logger.error('Error in available-slots:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * GET /api/v1/appointments/mine
 * Dashboard rápido: mis citas según rol.
 */
router.get('/mine', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const role = req.userRole!;
    const where: Record<string, unknown> = {};

    if (role === 'DOCTOR') {
      where['doctor'] = { userId };
    } else if (role === 'NURSE') {
      where['OR'] = [
        { assignedNurseId: userId },
        { doctor: { userId } },
      ];
    } else if (role === 'PATIENT') {
      where['patient'] = { userId };
    } else if (role === 'AGENT') {
      where['bookedById'] = userId;
    }

    const status = req.query['status'] as string | undefined;
    const dateFrom = req.query['dateFrom'] as string | undefined;
    const dateTo = req.query['dateTo'] as string | undefined;
    if (status) where['status'] = status;
    if (dateFrom || dateTo) {
      const scheduledAt: Record<string, Date> = {};
      if (dateFrom) scheduledAt['gte'] = new Date(dateFrom);
      if (dateTo) scheduledAt['lte'] = new Date(dateTo);
      where['scheduledAt'] = scheduledAt;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        service: { select: { name: true, basePrice: true, duration: true, requiredRole: true } },
        bookedBy: { select: { firstName: true, lastName: true } },
        marginSnapshot: true,
        acknowledgements: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 100,
    });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    logger.error('Error in /appointments/mine:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

/**
 * GET /api/v1/appointments
 * Lista general con paginación.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.userRole!;
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT', 'DOCTOR', 'NURSE'].includes(role)) {
      res.status(403).json({ success: false, message: 'No autorizado' });
      return;
    }

    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    const status = req.query['status'] as string | undefined;
    const serviceId = req.query['serviceId'] as string | undefined;
    if (status) where['status'] = status;
    if (serviceId) where['serviceId'] = serviceId;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          service: { select: { name: true, basePrice: true, requiredRole: true } },
          bookedBy: { select: { firstName: true, lastName: true } },
          marginSnapshot: true,
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      success: true,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      appointments,
    });
  } catch (err) {
    logger.error('Error in GET /appointments:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

/**
 * POST /api/v1/appointments
 * Crea una cita en estado PENDING. El agente que la crea queda registrado.
 */
router.post(
  '/',
  requireRole(['AGENT', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten() });
        return;
      }
      const data = parsed.data;

      const [doctor, service] = await Promise.all([
        prisma.doctor.findUnique({
          where: { id: data.doctorId },
          include: { user: { select: { firstName: true, lastName: true, role: true, isActive: true } } },
        }),
        prisma.service.findUnique({ where: { id: data.serviceId } }),
      ]);

      if (!doctor) {
        res.status(404).json({ success: false, message: 'Profesional no encontrado' });
        return;
      }
      if (!doctor.isAvailable) {
        res.status(400).json({ success: false, message: 'Profesional no disponible' });
        return;
      }
      if (!service || !service.isActive) {
        res.status(404).json({ success: false, message: 'Servicio no encontrado o inactivo' });
        return;
      }

      if (doctor.user.role !== service.requiredRole) {
        res.status(400).json({
          success: false,
          message: `Este servicio requiere un ${service.requiredRole}, no un ${doctor.user.role}`,
        });
        return;
      }

      const duration = data.duration || service.duration;
      const scheduledAt = new Date(data.scheduledAt);

      const appointment = await prisma.appointment.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          serviceId: data.serviceId,
          scheduledAt,
          duration,
          totalPrice: service.basePrice,
          address: data.address,
          city: data.city,
          bookedById: req.userId!,
          status: 'PENDING',
          ...(data.coordinates ? { coordinates: data.coordinates } : {}),
          ...(data.notes ? { notes: data.notes } : {}),
        },
        include: {
          service: true,
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      });

      res.status(201).json({ success: true, appointment });
    } catch (err) {
      logger.error('Error in POST /appointments:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * POST /api/v1/appointments/:id/confirm
 * Pasa a CONFIRMED y crea el MarginSnapshot.
 */
router.post(
  '/:id/confirm',
  requireRole(['AGENT', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apt = await prisma.appointment.findUnique({
        where: { id: req.params['id'] || '' },
        include: { service: true, doctor: { include: { user: { select: { id: true, role: true } } } } },
      });
      if (!apt) {
        res.status(404).json({ success: false, message: 'Cita no encontrada' });
        return;
      }
      if (apt.status !== 'PENDING') {
        res.status(400).json({ success: false, message: `No se puede confirmar (estado: ${apt.status})` });
        return;
      }

      const result = await MarginsService.createSnapshot({
        appointmentId: apt.id,
        totalPrice: apt.totalPrice,
        professionalId: apt.doctor.user.id,
        professionalRole: apt.doctor.user.role,
        agentId: apt.bookedById,
        serviceId: apt.serviceId,
      });

      if (!result.ok) {
        res.status(400).json({ success: false, message: result.error || 'Error al crear snapshot' });
        return;
      }

      const updated = await prisma.appointment.update({
        where: { id: apt.id },
        data: { status: 'CONFIRMED' },
        include: { marginSnapshot: true, service: true },
      });

      res.json({ success: true, appointment: updated, snapshotId: result.snapshotId });
    } catch (err) {
      logger.error('Error in /appointments/:id/confirm:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * POST /api/v1/appointments/:id/start
 * Profesional marca el inicio.
 */
router.post(
  '/:id/start',
  requireRole(['DOCTOR', 'NURSE', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apt = await prisma.appointment.findUnique({
        where: { id: req.params['id'] || '' },
        include: {
          service: true,
          marginSnapshot: true,
          doctor: { include: { user: { select: { id: true, role: true } } } },
        },
      });
      if (!apt) {
        res.status(404).json({ success: false, message: 'Cita no encontrada' });
        return;
      }
      if (apt.status !== 'CONFIRMED') {
        res.status(400).json({ success: false, message: `No se puede iniciar (estado: ${apt.status})` });
        return;
      }

      const userRole = req.userRole;
      if (userRole === 'DOCTOR' && apt.doctor.user.id !== req.userId) {
        res.status(403).json({ success: false, message: 'No autorizado para iniciar esta cita' });
        return;
      }
      if (userRole === 'NURSE' && apt.assignedNurseId !== req.userId) {
        res.status(403).json({ success: false, message: 'No autorizado para iniciar esta cita' });
        return;
      }

      const updated = await prisma.appointment.update({
        where: { id: apt.id },
        data: { status: 'IN_PROGRESS' },
      });
      res.json({ success: true, appointment: updated });
    } catch (err) {
      logger.error('Error in /appointments/:id/start:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * POST /api/v1/appointments/:id/complete
 * Marca la cita como COMPLETED y genera los PaymentAcknowledgements.
 */
router.post(
  '/:id/complete',
  requireRole(['DOCTOR', 'NURSE', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = completeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten() });
        return;
      }
      const { diagnosis, prescription, notes } = parsed.data;

      const apt = await prisma.appointment.findUnique({
        where: { id: req.params['id'] || '' },
        include: {
          marginSnapshot: true,
          doctor: { include: { user: { select: { id: true, role: true } } } },
        },
      });
      if (!apt) {
        res.status(404).json({ success: false, message: 'Cita no encontrada' });
        return;
      }
      if (apt.status !== 'IN_PROGRESS' && apt.status !== 'CONFIRMED') {
        res.status(400).json({ success: false, message: `No se puede completar (estado: ${apt.status})` });
        return;
      }

      const userRole = req.userRole;
      if (userRole === 'DOCTOR' && apt.doctor.user.id !== req.userId) {
        res.status(403).json({ success: false, message: 'No autorizado' });
        return;
      }
      if (userRole === 'NURSE' && apt.assignedNurseId !== req.userId) {
        res.status(403).json({ success: false, message: 'No autorizado' });
        return;
      }

      const updated = await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
          finishedById: req.userId || null,
          ...(diagnosis ? { diagnosis } : {}),
          ...(prescription ? { prescription } : {}),
          ...(notes ? { notes } : {}),
        },
      });

      if (!apt.marginSnapshot) {
        const snapshotResult = await MarginsService.createSnapshot({
          appointmentId: apt.id,
          totalPrice: apt.totalPrice,
          professionalId: apt.doctor.user.id,
          professionalRole: apt.doctor.user.role,
          agentId: apt.bookedById,
          serviceId: apt.serviceId,
        });

        if (!snapshotResult.ok) {
          res.status(400).json({
            success: false,
            message: snapshotResult.error || 'Error al crear snapshot financiero',
          });
          return;
        }
      }

      const ackResult = await MarginsService.generateAcknowledgements(apt.id);

      res.json({
        success: true,
        appointment: updated,
        acknowledgements: ackResult,
      });
    } catch (err) {
      logger.error('Error in /appointments/:id/complete:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);

/**
 * GET /api/v1/appointments/:id
 * Detalle completo de una cita.
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const apt = await prisma.appointment.findUnique({
      where: { id: req.params['id'] || '' },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true, role: true } } } },
        service: true,
        bookedBy: { select: { firstName: true, lastName: true } },
        finishedBy: { select: { firstName: true, lastName: true } },
        marginSnapshot: true,
        acknowledgements: { include: { recipient: { select: { firstName: true, lastName: true, role: true } } } },
      },
    });
    if (!apt) {
      res.status(404).json({ success: false, message: 'Cita no encontrada' });
      return;
    }
    res.json({ success: true, appointment: apt });
  } catch (err) {
    logger.error('Error in GET /appointments/:id:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

export default router;
