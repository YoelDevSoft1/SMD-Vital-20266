import { MedicalRecordType, Prisma, PrescriptionStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { config } from '../config/config';
import prismaClient from '../utils/prisma';
import { DocumentService, ClinicalDocumentContext, DocumentFile } from './document.service';
import { QueueService } from './queue.service';
import { logger } from '../utils/logger';
import {
  buildSlots,
  extractCoordinates,
  formatDateOnly,
  getDayRange,
  haversineDistanceKm,
  validateTimeRange
} from '../utils/scheduling';

export interface ClinicalAppointmentFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export interface EncounterNoteInput {
  summary?: string | undefined;
  payload?: Record<string, unknown> | undefined;
  templateVersion?: string | undefined;
}

export interface VitalSignInput {
  bpSys?: number | undefined;
  bpDia?: number | undefined;
  heartRate?: number | undefined;
  respiratoryRate?: number | undefined;
  temperature?: number | undefined;
  spo2?: number | undefined;
  weight?: number | undefined;
  height?: number | undefined;
  notes?: string | undefined;
}

export interface FinishEncounterInput {
  encounterSummary?: string | undefined;
  encounterPayload?: Record<string, unknown> | undefined;
  medicalRecord: {
    title: string;
    description: string;
    type?: MedicalRecordType | string | undefined;
    payload?: Record<string, unknown> | undefined;
    doctorNotes?: string | undefined;
    templateVersion?: string | undefined;
  };
  prescription?: {
    notes?: string | undefined;
    templateVersion?: string | undefined;
    items: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string | undefined;
    }>;
  } | undefined;
}

export interface CreateMedicalRecordByEmailInput {
  patientEmail: string;
  patientFirstName?: string | undefined;
  patientLastName?: string | undefined;
  patientDateOfBirth?: string | undefined;
  patientGender?: string | undefined;
  serviceName?: string | undefined;
  sendEmail?: boolean | undefined;
  vitals?: {
    bpSys?: number | undefined;
    bpDia?: number | undefined;
    heartRate?: number | undefined;
    respiratoryRate?: number | undefined;
    temperature?: number | undefined;
    spo2?: number | undefined;
    weight?: number | undefined;
    height?: number | undefined;
  } | undefined;
  medicalRecord: {
    title: string;
    description: string;
    type?: MedicalRecordType | string | undefined;
    payload?: Record<string, unknown> | undefined;
    doctorNotes?: string | undefined;
    templateVersion?: string | undefined;
  };
  prescription?: {
    notes?: string | undefined;
    templateVersion?: string | undefined;
    items: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string | undefined;
    }>;
  } | undefined;
}

export interface DoctorAvailabilityBlockInput {
  startTime: string;
  endTime: string;
  notes?: string | undefined;
  isActive?: boolean | undefined;
}

export class ClinicalService {
  private prisma = prismaClient;
  private documentService = new DocumentService();
  private readonly sortDesc: Prisma.SortOrder = 'desc';

  public async listAppointments(userId: string, role: UserRole, filters: ClinicalAppointmentFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = this.buildAppointmentWhere(userId, role, filters.status);

    const [appointments, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: this.sortDesc },
        include: this.getAppointmentInclude()
      }),
      this.prisma.appointment.count({ where })
    ]);

    return {
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  public async getMyAvailability(userId: string, date: string, duration = 60) {
    const doctor = await this.getDoctorByUserId(userId);
    const { start, end, dateOnly } = getDayRange(date);

    const [availability, appointments] = await this.prisma.$transaction([
      this.prisma.doctorAvailability.findMany({
        where: {
          doctorId: doctor.id,
          date: dateOnly,
          isActive: true
        },
        orderBy: { startTime: 'asc' }
      }),
      this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          scheduledAt: { gte: start, lt: end },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] }
        },
        orderBy: { scheduledAt: 'asc' },
        include: this.getAppointmentInclude()
      })
    ]);

    return {
      doctor,
      date: formatDateOnly(dateOnly),
      availability,
      appointments,
      slots: buildSlots(availability, appointments, duration)
    };
  }

  public async setMyAvailability(userId: string, date: string, blocks: DoctorAvailabilityBlockInput[]) {
    const doctor = await this.getDoctorByUserId(userId);
    const { dateOnly } = getDayRange(date);

    const sanitizedBlocks = blocks.map((block) => ({
      startTime: block.startTime,
      endTime: block.endTime,
      notes: block.notes ?? null,
      isActive: block.isActive ?? true
    }));

    sanitizedBlocks.forEach(validateTimeRange);

    await this.prisma.$transaction(async (tx) => {
      await tx.doctorAvailability.deleteMany({
        where: {
          doctorId: doctor.id,
          date: dateOnly
        }
      });

      if (sanitizedBlocks.length > 0) {
        await tx.doctorAvailability.createMany({
          data: sanitizedBlocks.map((block) => ({
            doctorId: doctor.id,
            date: dateOnly,
            ...block
          }))
        });
      }
    });

    return this.getMyAvailability(userId, date);
  }

  public async getMyRoute(userId: string, date: string) {
    const doctor = await this.getDoctorByUserId(userId);
    const { start, end, dateOnly } = getDayRange(date);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: start, lt: end },
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] }
      },
      orderBy: { scheduledAt: 'asc' },
      include: this.getAppointmentInclude()
    });

    const stops = appointments.map((appointment, index) => ({
      appointment,
      order: index + 1,
      coordinates: extractCoordinates(appointment.coordinates)
    }));

    const segments = [];
    for (let index = 0; index < stops.length - 1; index += 1) {
      const current = stops[index];
      const next = stops[index + 1];
      if (!current?.coordinates || !next?.coordinates) {
        segments.push({
          fromAppointmentId: current?.appointment.id,
          toAppointmentId: next?.appointment.id,
          distanceKm: null,
          estimatedTravelMinutes: null,
          availableMinutes: null,
          status: 'MISSING_COORDINATES'
        });
        continue;
      }

      const distanceKm = haversineDistanceKm(current.coordinates, next.coordinates);
      const estimatedTravelMinutes = Math.ceil((distanceKm / 25) * 60) + 10;
      const currentEnd = current.appointment.scheduledAt.getTime() + current.appointment.duration * 60 * 1000;
      const availableMinutes = Math.floor((next.appointment.scheduledAt.getTime() - currentEnd) / 60000);
      const status = availableMinutes < 0
        ? 'CONFLICT'
        : availableMinutes < estimatedTravelMinutes
          ? 'RISK'
          : 'OK';

      segments.push({
        fromAppointmentId: current.appointment.id,
        toAppointmentId: next.appointment.id,
        distanceKm: Number(distanceKm.toFixed(2)),
        estimatedTravelMinutes,
        availableMinutes,
        status
      });
    }

    return {
      doctor,
      date: formatDateOnly(dateOnly),
      appointments,
      stops,
      segments
    };
  }

  public async getAppointmentDetails(userId: string, role: UserRole, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: this.buildAppointmentWhere(userId, role, undefined, appointmentId),
      include: this.getAppointmentInclude()
    });

    if (!appointment) {
      throw this.createHttpError(404, 'Appointment not found');
    }

    return appointment;
  }

  public async startEncounter(userId: string, role: UserRole, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: this.buildAppointmentWhere(userId, role, undefined, appointmentId),
      include: {
        encounter: true,
        service: true
      }
    });

    if (!appointment) {
      throw this.createHttpError(404, 'Appointment not found');
    }

    if (appointment.status === 'COMPLETED') {
      throw this.createHttpError(409, 'Appointment already completed');
    }

    const nurseId = appointment.assignedNurseId || (role === 'NURSE' ? userId : null);

    return this.prisma.$transaction(async (tx) => {
      const encounterUpdate: Prisma.EncounterUpdateInput = {
        status: 'IN_PROGRESS'
      };
      if (nurseId) {
        encounterUpdate.nurse = { connect: { id: nurseId } };
      }

      const encounter = await tx.encounter.upsert({
        where: { appointmentId: appointment.id },
        create: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          nurseId: nurseId ?? null,
          status: 'IN_PROGRESS'
        },
        update: encounterUpdate
      });

      const appointmentUpdate: Prisma.AppointmentUpdateInput = {
        status: 'IN_PROGRESS'
      };
      if (role === 'NURSE' && !appointment.assignedNurseId) {
        appointmentUpdate.assignedNurse = { connect: { id: userId } };
      }

      await tx.appointment.update({
        where: { id: appointment.id },
        data: appointmentUpdate
      });

      await tx.serviceTrace.create({
        data: {
          appointmentId: appointment.id,
          encounterId: encounter.id,
          actorId: userId,
          actorRole: role,
          action: 'STARTED',
          payload: {
            status: 'IN_PROGRESS'
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: role,
          entity: 'ENCOUNTER',
          entityId: encounter.id,
          action: 'UPDATE',
          payload: { status: 'IN_PROGRESS' }
        }
      });

      return encounter;
    });
  }

  public async recordVitals(userId: string, encounterId: string, payload: VitalSignInput) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      include: {
        appointment: true
      }
    });

    if (!encounter) {
      throw this.createHttpError(404, 'Encounter not found');
    }

    if (encounter.appointment.assignedNurseId && encounter.appointment.assignedNurseId !== userId) {
      throw this.createHttpError(403, 'Not assigned to this appointment');
    }

    if (encounter.nurseId && encounter.nurseId !== userId) {
      throw this.createHttpError(403, 'Not assigned to this encounter');
    }

    return this.prisma.$transaction(async (tx) => {
      if (!encounter.nurseId) {
        await tx.encounter.update({
          where: { id: encounter.id },
          data: { nurse: { connect: { id: userId } } }
        });
      }

      const vitalSign = await tx.vitalSign.create({
        data: {
          encounterId: encounter.id,
          recordedById: userId,
          bpSys: payload.bpSys ?? null,
          bpDia: payload.bpDia ?? null,
          heartRate: payload.heartRate ?? null,
          respiratoryRate: payload.respiratoryRate ?? null,
          temperature: payload.temperature ?? null,
          spo2: payload.spo2 ?? null,
          weight: payload.weight ?? null,
          height: payload.height ?? null,
          notes: payload.notes ?? null
        }
      });

      await tx.serviceTrace.create({
        data: {
          appointmentId: encounter.appointmentId,
          encounterId: encounter.id,
          actorId: userId,
          actorRole: 'NURSE',
          action: 'VITALS_RECORDED',
          payload: this.toJson(payload)
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: 'NURSE',
          entity: 'ENCOUNTER',
          entityId: encounter.id,
          action: 'UPDATE',
          payload: this.toJson({ vitals: payload })
        }
      });

      return vitalSign;
    });
  }

  public async addEncounterNotes(userId: string, encounterId: string, data: EncounterNoteInput) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      include: {
        appointment: { include: { doctor: { include: { user: true } } } }
      }
    });

    if (!encounter) {
      throw this.createHttpError(404, 'Encounter not found');
    }

    if (encounter.appointment.doctor.userId !== userId) {
      throw this.createHttpError(403, 'Not assigned to this appointment');
    }

    const currentPayload = (encounter.payload as Record<string, unknown> | null) ?? {};
    const nextPayload = data.payload ? { ...currentPayload, ...data.payload } : currentPayload;

    return this.prisma.$transaction(async (tx) => {
      const updatedEncounter = await tx.encounter.update({
        where: { id: encounter.id },
        data: {
          summary: data.summary ?? encounter.summary ?? null,
          payload: this.toJson(nextPayload),
          templateVersion: data.templateVersion ?? encounter.templateVersion ?? null
        }
      });

      await tx.serviceTrace.create({
        data: {
          appointmentId: encounter.appointmentId,
          encounterId: encounter.id,
          actorId: userId,
          actorRole: 'DOCTOR',
          action: 'NOTE_ADDED',
          payload: this.toJson(data)
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: 'DOCTOR',
          entity: 'ENCOUNTER',
          entityId: encounter.id,
          action: 'UPDATE',
          payload: this.toJson(data)
        }
      });

      return updatedEncounter;
    });
  }

  public async finishEncounter(userId: string, role: UserRole, appointmentId: string, payload: FinishEncounterInput) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        service: true,
        encounter: {
          include: {
            vitals: { orderBy: { recordedAt: this.sortDesc }, take: 1 }
          }
        },
        assignedNurse: true
      }
    });

    if (!appointment) {
      throw this.createHttpError(404, 'Appointment not found');
    }

    if (role === 'DOCTOR' && appointment.doctor.userId !== userId) {
      throw this.createHttpError(403, 'Not assigned to this appointment');
    }

    if (role === 'NURSE') {
      const allowedByCategory = appointment.service?.category === 'NURSING';
      const assigned = appointment.assignedNurseId === userId;
      if (!assigned && !allowedByCategory) {
        throw this.createHttpError(403, 'Not assigned to this appointment');
      }
    }

    if (appointment.status === 'COMPLETED') {
      const [medicalRecord, prescription] = await Promise.all([
        this.prisma.medicalRecord.findFirst({ where: { appointmentId } }),
        this.prisma.prescription.findFirst({ where: { appointmentId } })
      ]);

      return {
        appointment,
        encounter: appointment.encounter,
        medicalRecord,
        prescription,
        alreadyCompleted: true
      };
    }

    const nurseId = appointment.assignedNurseId || (role === 'NURSE' ? userId : null);
    const encounterSummary = payload.encounterSummary ?? appointment.encounter?.summary ?? null;
    const mergedPayload = this.mergeEncounterPayload(appointment.encounter?.payload, payload.encounterPayload, payload.medicalRecord.payload);
    const recordType = (payload.medicalRecord.type || 'DIAGNOSIS') as MedicalRecordType;
    const now = new Date();

    const transactionResult = await this.prisma.$transaction(async (tx) => {
      const encounterUpdate: Prisma.EncounterUpdateInput = {
        status: 'COMPLETED',
        summary: encounterSummary,
        payload: this.toJson(mergedPayload),
        templateVersion: payload.medicalRecord.templateVersion ?? appointment.encounter?.templateVersion ?? null,
        finishedAt: now
      };
      if (nurseId) {
        encounterUpdate.nurse = { connect: { id: nurseId } };
      }

      const encounter = await tx.encounter.upsert({
        where: { appointmentId: appointment.id },
        create: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          nurseId: nurseId ?? null,
          status: 'COMPLETED',
          summary: encounterSummary,
          payload: this.toJson(mergedPayload),
          templateVersion: payload.medicalRecord.templateVersion ?? null,
          finishedAt: now
        },
        update: encounterUpdate
      });

      const medicalRecordPayload = payload.medicalRecord.payload
        ? this.toJson(payload.medicalRecord.payload)
        : Prisma.DbNull;

      const medicalRecord = await tx.medicalRecord.create({
        data: {
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          encounterId: encounter.id,
          doctorId: appointment.doctorId,
          nurseId: nurseId ?? null,
          title: payload.medicalRecord.title,
          description: payload.medicalRecord.description,
          type: recordType,
          payload: medicalRecordPayload,
          doctorNotes: payload.medicalRecord.doctorNotes ?? null,
          pdfPath: null,
          templateVersion: payload.medicalRecord.templateVersion ?? null
        }
      });

      let prescription = null;
      if (payload.prescription?.items?.length) {
        const items = payload.prescription.items;
        const first = items[0];
        if (!first) {
          throw this.createHttpError(400, 'Prescription items are required');
        }
        prescription = await tx.prescription.create({
          data: {
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            appointmentId: appointment.id,
            encounterId: encounter.id,
            medication: first.medication,
            dosage: first.dosage,
            frequency: first.frequency,
            duration: first.duration,
            instructions: first.instructions ?? null,
            status: PrescriptionStatus.FINAL,
            notes: payload.prescription.notes ?? null,
            pdfPath: null,
            templateVersion: payload.prescription.templateVersion ?? null,
            items: {
              create: items.map((item) => ({
                medication: item.medication,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions ?? null
              }))
            }
          }
        });
      }

      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'COMPLETED',
          finishedAt: now,
          finishedById: userId,
          assignedNurseId: nurseId ?? appointment.assignedNurseId ?? null
        }
      });

      const traces: Prisma.ServiceTraceCreateManyInput[] = [
        {
          appointmentId: appointment.id,
          encounterId: encounter.id,
          actorId: userId,
          actorRole: role,
          action: 'STATUS_CHANGED',
          payload: { status: 'COMPLETED' },
          createdAt: now
        }
      ];

      if (prescription) {
        traces.push({
          appointmentId: appointment.id,
          encounterId: encounter.id,
          actorId: userId,
          actorRole: role,
          action: 'PRESCRIPTION_CREATED',
          payload: { prescriptionId: prescription.id },
          createdAt: now
        });
      }

      await tx.serviceTrace.createMany({ data: traces });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: role,
          entity: 'APPOINTMENT',
          entityId: appointment.id,
          action: 'COMPLETE',
          payload: {
            appointmentId: appointment.id,
            encounterId: encounter.id
          }
        }
      });

      return { encounter, medicalRecord, prescription };
    });

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    const vitals = appointment.encounter?.vitals?.[0] ?? null;
    const actorName = actor ? `${actor.firstName} ${actor.lastName}` : null;
    const nurseName = appointment.assignedNurse
      ? `${appointment.assignedNurse.firstName} ${appointment.assignedNurse.lastName}`
      : role === 'NURSE'
      ? actorName
      : null;

    const documentContext: ClinicalDocumentContext = {
      appointment: {
        id: appointment.id,
        scheduledAt: appointment.scheduledAt,
        address: appointment.address,
        city: appointment.city,
        serviceName: appointment.service?.name ?? null,
        serviceCategory: appointment.service?.category ?? null
      },
      patient: {
        name: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
        email: appointment.patient.user.email,
        dateOfBirth: appointment.patient.dateOfBirth,
        gender: appointment.patient.gender
      },
      doctor: {
        name: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        specialty: appointment.doctor.specialty,
        licenseNumber: appointment.doctor.licenseNumber,
        logoPath: appointment.doctor.logoPath,
        signaturePath: appointment.doctor.signaturePath
      },
      nurse: nurseName ? { name: nurseName } : null,
      encounter: {
        summary: transactionResult.encounter.summary,
        payload: transactionResult.encounter.payload as Record<string, unknown> | null,
        finishedAt: transactionResult.encounter.finishedAt
      },
      vitals: vitals
        ? {
            bpSys: vitals.bpSys,
            bpDia: vitals.bpDia,
            heartRate: vitals.heartRate,
            respiratoryRate: vitals.respiratoryRate,
            temperature: vitals.temperature,
            spo2: vitals.spo2,
            weight: vitals.weight,
            height: vitals.height,
            recordedAt: vitals.recordedAt
          }
        : null,
      medicalRecord: {
        title: transactionResult.medicalRecord.title,
        description: transactionResult.medicalRecord.description,
        doctorNotes: transactionResult.medicalRecord.doctorNotes,
        payload: transactionResult.medicalRecord.payload as Record<string, unknown> | null
      },
      prescription: transactionResult.prescription
        ? {
            notes: transactionResult.prescription.notes,
            items: payload.prescription?.items ?? []
          }
        : null,
      generatedBy: {
        role,
        name: actorName || role
      }
    };

    const recordDocument = await this.documentService.generateMedicalRecord(documentContext);
    let prescriptionDocument: DocumentFile | null = null;
    if (transactionResult.prescription) {
      prescriptionDocument = await this.documentService.generatePrescription(documentContext);
    }

    await this.prisma.medicalRecord.update({
      where: { id: transactionResult.medicalRecord.id },
      data: {
        pdfPath: recordDocument.filePath,
        templateVersion: recordDocument.templateVersion
      }
    });

    if (transactionResult.prescription && prescriptionDocument) {
      await this.prisma.prescription.update({
        where: { id: transactionResult.prescription.id },
        data: {
          pdfPath: prescriptionDocument.filePath,
          templateVersion: prescriptionDocument.templateVersion
        }
      });
    }

    const documentsToSend = [
      { fileName: recordDocument.fileName, filePath: recordDocument.filePath }
    ];
    if (prescriptionDocument) {
      documentsToSend.push({
        fileName: prescriptionDocument.fileName,
        filePath: prescriptionDocument.filePath
      });
    }

    const patientEmail = appointment.patient.user.email;
    let emailQueued = false;

    if (patientEmail) {
      try {
        await QueueService.addClinicalDocumentsJob({
          to: patientEmail,
          firstName: appointment.patient.user.firstName,
          appointment,
          documents: documentsToSend
        });
        emailQueued = true;
      } catch (error: any) {
        logger.error('Failed to queue clinical documents email:', error);
      }
    } else {
      logger.warn('Patient email missing, skipping clinical documents email', { appointmentId });
    }

    if (emailQueued) {
      await this.prisma.$transaction([
        this.prisma.serviceTrace.create({
          data: {
            appointmentId: appointment.id,
            encounterId: transactionResult.encounter.id,
            actorId: userId,
            actorRole: role,
            action: 'DOCUMENT_SENT',
            payload: { documents: documentsToSend }
          }
        }),
        this.prisma.auditLog.create({
          data: {
            actorId: userId,
            actorRole: role,
            entity: 'APPOINTMENT',
            entityId: appointment.id,
            action: 'SEND_EMAIL',
            payload: { documents: documentsToSend }
          }
        })
      ]);
    }

    return {
      appointment,
      encounter: transactionResult.encounter,
      medicalRecord: transactionResult.medicalRecord,
      prescription: transactionResult.prescription,
      documents: documentsToSend,
      emailQueued
    };
  }

  public async createMedicalRecordByEmail(
    userId: string,
    role: UserRole,
    payload: CreateMedicalRecordByEmailInput
  ) {
    if (role !== 'DOCTOR' && role !== 'NURSE') {
      throw this.createHttpError(403, 'Access denied');
    }

    const patientEmail = payload.patientEmail.trim();
    const patientFirstName = payload.patientFirstName?.trim() || 'Paciente';
    const patientLastName = payload.patientLastName?.trim() || 'SMD Vital';

    const ensurePatientData: {
      email: string;
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      gender?: string;
    } = {
      email: patientEmail,
      firstName: patientFirstName,
      lastName: patientLastName,
    };

    if (payload.patientDateOfBirth) {
      ensurePatientData.dateOfBirth = payload.patientDateOfBirth;
    }

    if (payload.patientGender) {
      ensurePatientData.gender = payload.patientGender;
    }

    const patientResult = await this.ensurePatientByEmail(ensurePatientData);

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    const actorName = actor ? `${actor.firstName} ${actor.lastName}` : role;
    let doctorRecord: {
      id: string;
      specialty: string;
      licenseNumber: string;
      logoPath: string | null;
      signaturePath: string | null;
      user: { firstName: string; lastName: string };
    } | null = null;

    if (role === 'DOCTOR') {
      doctorRecord = await this.prisma.doctor.findUnique({
        where: { userId },
        select: {
          id: true,
          specialty: true,
          licenseNumber: true,
          logoPath: true,
          signaturePath: true,
          user: { select: { firstName: true, lastName: true } }
        }
      });

      if (!doctorRecord) {
        throw this.createHttpError(404, 'Doctor profile not found');
      }
    }

    if (payload.prescription?.items?.length && !doctorRecord) {
      throw this.createHttpError(403, 'Only doctors can create prescriptions');
    }

    const recordType = (payload.medicalRecord.type || 'DIAGNOSIS') as MedicalRecordType;
    const medicalRecordPayload = payload.medicalRecord.payload
      ? this.toJson(payload.medicalRecord.payload)
      : Prisma.DbNull;
    const now = new Date();

    const transactionResult = await this.prisma.$transaction(async (tx) => {
      const medicalRecord = await tx.medicalRecord.create({
        data: {
          patientId: patientResult.patient.id,
          appointmentId: null,
          encounterId: null,
          doctorId: doctorRecord?.id ?? null,
          nurseId: role === 'NURSE' ? userId : null,
          title: payload.medicalRecord.title,
          description: payload.medicalRecord.description,
          type: recordType,
          payload: medicalRecordPayload,
          doctorNotes: payload.medicalRecord.doctorNotes ?? null,
          pdfPath: null,
          templateVersion: payload.medicalRecord.templateVersion ?? null
        }
      });

      let prescription = null;
      if (payload.prescription?.items?.length) {
        const items = payload.prescription.items;
        const first = items[0];
        if (!first || !doctorRecord) {
          throw this.createHttpError(400, 'Prescription items are required');
        }

        prescription = await tx.prescription.create({
          data: {
            patientId: patientResult.patient.id,
            doctorId: doctorRecord.id,
            appointmentId: null,
            encounterId: null,
            medication: first.medication,
            dosage: first.dosage,
            frequency: first.frequency,
            duration: first.duration,
            instructions: first.instructions ?? null,
            status: PrescriptionStatus.FINAL,
            notes: payload.prescription.notes ?? null,
            pdfPath: null,
            templateVersion: payload.prescription.templateVersion ?? null,
            items: {
              create: items.map((item) => ({
                medication: item.medication,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions ?? null
              }))
            }
          }
        });
      }

      const auditLogs: Prisma.AuditLogCreateManyInput[] = [
        {
          actorId: userId,
          actorRole: role,
          entity: 'MEDICAL_RECORD',
          entityId: medicalRecord.id,
          action: 'CREATE',
          payload: this.toJson({
            patientId: patientResult.patient.id,
            source: 'EMAIL'
          }),
          createdAt: now
        }
      ];

      if (prescription) {
        auditLogs.push({
          actorId: userId,
          actorRole: role,
          entity: 'PRESCRIPTION',
          entityId: prescription.id,
          action: 'CREATE',
          payload: this.toJson({
            patientId: patientResult.patient.id,
            source: 'EMAIL'
          }),
          createdAt: now
        });
      }

      await tx.auditLog.createMany({ data: auditLogs });

      return { medicalRecord, prescription };
    });

    const doctorName = doctorRecord
      ? `${doctorRecord.user.firstName} ${doctorRecord.user.lastName}`
      : null;
    const nurseName = role === 'NURSE' ? actorName : null;

    const documentContext: ClinicalDocumentContext = {
      appointment: {
        id: transactionResult.medicalRecord.id,
        scheduledAt: now,
        serviceName: payload.serviceName ?? 'Historia clinica',
        serviceCategory: null,
        address: null,
        city: null
      },
      patient: {
        name: `${patientResult.user.firstName} ${patientResult.user.lastName}`,
        email: patientResult.user.email,
        dateOfBirth: patientResult.patient.dateOfBirth,
        gender: patientResult.patient.gender
      },
      doctor: doctorName
        ? {
            name: doctorName,
            specialty: doctorRecord?.specialty ?? null,
            licenseNumber: doctorRecord?.licenseNumber ?? null,
            logoPath: doctorRecord?.logoPath ?? null,
            signaturePath: doctorRecord?.signaturePath ?? null
          }
        : null,
      nurse: nurseName ? { name: nurseName } : null,
      encounter: null,
      vitals: payload.vitals
        ? {
            bpSys: payload.vitals.bpSys ?? null,
            bpDia: payload.vitals.bpDia ?? null,
            heartRate: payload.vitals.heartRate ?? null,
            respiratoryRate: payload.vitals.respiratoryRate ?? null,
            temperature: payload.vitals.temperature ?? null,
            spo2: payload.vitals.spo2 ?? null,
            weight: payload.vitals.weight ?? null,
            height: payload.vitals.height ?? null,
            recordedAt: now
          }
        : null,
      medicalRecord: {
        title: transactionResult.medicalRecord.title,
        description: transactionResult.medicalRecord.description,
        doctorNotes: transactionResult.medicalRecord.doctorNotes,
        payload: transactionResult.medicalRecord.payload as Record<string, unknown> | null
      },
      prescription: transactionResult.prescription
        ? {
            notes: transactionResult.prescription.notes,
            items: payload.prescription?.items ?? []
          }
        : null,
      generatedBy: {
        role,
        name: actorName || role
      }
    };

    const recordDocument = await this.documentService.generateMedicalRecord(documentContext);
    let prescriptionDocument: DocumentFile | null = null;
    if (transactionResult.prescription) {
      prescriptionDocument = await this.documentService.generatePrescription(documentContext);
    }

    await this.prisma.medicalRecord.update({
      where: { id: transactionResult.medicalRecord.id },
      data: {
        pdfPath: recordDocument.filePath,
        templateVersion: recordDocument.templateVersion
      }
    });

    if (transactionResult.prescription && prescriptionDocument) {
      await this.prisma.prescription.update({
        where: { id: transactionResult.prescription.id },
        data: {
          pdfPath: prescriptionDocument.filePath,
          templateVersion: prescriptionDocument.templateVersion
        }
      });
    }

    const documentsToSend = [
      { fileName: recordDocument.fileName, filePath: recordDocument.filePath }
    ];
    if (prescriptionDocument) {
      documentsToSend.push({
        fileName: prescriptionDocument.fileName,
        filePath: prescriptionDocument.filePath
      });
    }

    const appointmentSnapshot = {
      id: transactionResult.medicalRecord.id,
      scheduledAt: now,
      service: { name: payload.serviceName ?? 'Historia clinica' },
      doctor: doctorRecord
        ? { user: { firstName: doctorRecord.user.firstName, lastName: doctorRecord.user.lastName } }
        : null
    };

    const shouldSendEmail = payload.sendEmail !== false;
    let emailQueued = false;

    if (shouldSendEmail && patientResult.user.email) {
      try {
        await QueueService.addClinicalDocumentsJob({
          to: patientResult.user.email,
          firstName: patientResult.user.firstName,
          appointment: appointmentSnapshot,
          documents: documentsToSend
        });
        emailQueued = true;
      } catch (error: any) {
        logger.error('Failed to queue clinical documents email:', error);
      }
    }

    if (emailQueued) {
      await this.prisma.auditLog.create({
        data: {
          actorId: userId,
          actorRole: role,
          entity: 'MEDICAL_RECORD',
          entityId: transactionResult.medicalRecord.id,
          action: 'SEND_EMAIL',
          payload: this.toJson({ documents: documentsToSend, patientEmail }),
          createdAt: now
        }
      });
    }

    return {
      medicalRecord: transactionResult.medicalRecord,
      prescription: transactionResult.prescription,
      documents: documentsToSend,
      emailQueued,
      patient: {
        id: patientResult.patient.id,
        email: patientResult.user.email
      }
    };
  }

  public async getMedicalRecord(userId: string, role: UserRole, recordId: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true
      }
    });

    if (!record) {
      throw this.createHttpError(404, 'Medical record not found');
    }

    if (role === 'PATIENT' && record.patient.userId !== userId) {
      throw this.createHttpError(403, 'Access denied');
    }

    if (role === 'DOCTOR' && record.doctor?.userId !== userId) {
      throw this.createHttpError(403, 'Access denied');
    }

    if (role === 'NURSE' && record.nurseId !== userId && record.appointment?.assignedNurseId !== userId) {
      throw this.createHttpError(403, 'Access denied');
    }

    return record;
  }

  public async getPrescription(userId: string, role: UserRole, prescriptionId: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
        items: true
      }
    });

    if (!prescription) {
      throw this.createHttpError(404, 'Prescription not found');
    }

    if (role === 'PATIENT' && prescription.patient.userId !== userId) {
      throw this.createHttpError(403, 'Access denied');
    }

    if (role === 'DOCTOR' && prescription.doctor.userId !== userId) {
      throw this.createHttpError(403, 'Access denied');
    }

    if (role === 'NURSE' && prescription.appointment?.assignedNurseId !== userId) {
      throw this.createHttpError(403, 'Access denied');
    }

    return prescription;
  }

  public async getPatientHistory(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        medicalRecords: {
          include: { doctor: { include: { user: true } } },
          orderBy: { createdAt: 'desc' }
        },
        prescriptions: {
          include: { doctor: { include: { user: true } }, items: true },
          orderBy: { createdAt: 'desc' }
        },
        appointments: {
          include: { doctor: { include: { user: true } }, service: true },
          orderBy: { scheduledAt: 'desc' }
        }
      }
    });

    if (!patient) {
      throw this.createHttpError(404, 'Patient not found');
    }

    return patient;
  }

  public async getMedicalRecordDocument(userId: string, role: UserRole, recordId: string) {
    const record = await this.getMedicalRecord(userId, role, recordId);
    if (!record.pdfPath) {
      throw this.createHttpError(404, 'Medical record PDF not available');
    }

    return {
      filePath: record.pdfPath,
      fileName: record.pdfPath.split('/').pop() || 'medical-record.pdf'
    };
  }

  public async getPrescriptionDocument(userId: string, role: UserRole, prescriptionId: string) {
    const prescription = await this.getPrescription(userId, role, prescriptionId);
    if (!prescription.pdfPath) {
      throw this.createHttpError(404, 'Prescription PDF not available');
    }

    return {
      filePath: prescription.pdfPath,
      fileName: prescription.pdfPath.split('/').pop() || 'prescription.pdf'
    };
  }

  private buildAppointmentWhere(
    userId: string,
    role: UserRole,
    status?: string,
    appointmentId?: string
  ): Prisma.AppointmentWhereInput {
    const where: Prisma.AppointmentWhereInput = {};

    if (appointmentId) {
      where.id = appointmentId;
    }

    if (status) {
      where.status = status as any;
    }

    if (role === 'DOCTOR') {
      where.doctor = { userId };
    } else if (role === 'NURSE') {
      where.assignedNurseId = userId;
    } else if (role === 'PATIENT') {
      where.patient = { userId };
    }

    return where;
  }

  private async getDoctorByUserId(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!doctor) {
      throw this.createHttpError(404, 'Doctor profile not found');
    }

    return doctor;
  }

  private getAppointmentInclude(): Prisma.AppointmentInclude {
    return {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      service: true,
      assignedNurse: true,
      encounter: {
        include: {
          vitals: { orderBy: { recordedAt: this.sortDesc }, take: 1 }
        }
      }
    };
  }

  private mergeEncounterPayload(
    currentPayload: unknown,
    encounterPayload?: Record<string, unknown>,
    medicalPayload?: Record<string, unknown>
  ) {
    const basePayload = (currentPayload as Record<string, unknown> | null) ?? {};
    const merged = { ...basePayload };

    if (encounterPayload) {
      Object.assign(merged, encounterPayload);
    }

    if (medicalPayload) {
      merged['medicalRecord'] = medicalPayload;
    }

    return merged;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private async ensurePatientByEmail(data: {
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { patient: true }
    });

    if (existingUser) {
      if (existingUser.role !== 'PATIENT') {
        throw this.createHttpError(409, 'Email already belongs to a non-patient account');
      }

      let user = existingUser;
      if (existingUser.isPlaceholder) {
        const updateData: Prisma.UserUpdateInput = {};
        if (data.firstName && data.firstName !== existingUser.firstName) {
          updateData.firstName = data.firstName;
        }
        if (data.lastName && data.lastName !== existingUser.lastName) {
          updateData.lastName = data.lastName;
        }

        if (Object.keys(updateData).length > 0) {
          user = await this.prisma.user.update({
            where: { id: existingUser.id },
            data: updateData,
            include: { patient: true }
          });
        }
      }

      if (!user.patient) {
        const patientData: Prisma.PatientCreateInput = {
          user: { connect: { id: user.id } }
        };

        if (data.dateOfBirth) {
          patientData.dateOfBirth = new Date(data.dateOfBirth);
        }
        if (data.gender) {
          patientData.gender = data.gender as any;
        }

        const patient = await this.prisma.patient.create({
          data: patientData
        });
        return { user, patient, createdUser: false, createdPatient: true };
      } else if (user.patient && (data.dateOfBirth || data.gender)) {
        const patientUpdateData: Prisma.PatientUpdateInput = {};
        if (data.dateOfBirth && !user.patient.dateOfBirth) {
          patientUpdateData.dateOfBirth = new Date(data.dateOfBirth);
        }
        if (data.gender && !user.patient.gender) {
          patientUpdateData.gender = data.gender as any;
        }

        if (Object.keys(patientUpdateData).length > 0) {
          const updatedPatient = await this.prisma.patient.update({
            where: { id: user.patient.id },
            data: patientUpdateData
          });
          return { user, patient: updatedPatient, createdUser: false, createdPatient: false };
        }
      }

      return { user, patient: user.patient, createdUser: false, createdPatient: false };
    }

    const randomPassword = randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, config.security.bcryptRounds);

    const patientData: Prisma.PatientCreateWithoutUserInput = {};
    if (data.dateOfBirth) {
      patientData.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.gender) {
      patientData.gender = data.gender as any;
    }

    const createdUser = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'PATIENT',
        isActive: false,
        isVerified: false,
        isPlaceholder: true,
        patient: {
          create: patientData
        }
      },
      include: { patient: true }
    });

    if (!createdUser.patient) {
      throw this.createHttpError(500, 'Failed to create patient');
    }

    return { user: createdUser, patient: createdUser.patient, createdUser: true, createdPatient: true };
  }

  private createHttpError(statusCode: number, message: string, details?: any) {
    const error = new Error(message) as Error & { statusCode?: number; details?: any };
    error.statusCode = statusCode;
    if (details) {
      error.details = details;
    }
    return error;
  }
}
