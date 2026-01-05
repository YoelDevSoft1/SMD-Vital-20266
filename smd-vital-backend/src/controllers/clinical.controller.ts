import { Request, Response } from 'express';
import path from 'path';
import { ClinicalService } from '../services/clinical.service';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';
import {
  clinicalFinishSchema,
  clinicalRecordByEmailSchema,
  clinicalVitalsSchema,
  encounterNotesSchema
} from '../types/validation';
import { config } from '../config/config';

export class ClinicalController {
  private clinicalService: ClinicalService;

  constructor() {
    this.clinicalService = new ClinicalService();
  }

  public getAssignedAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10', status } = req.query;
      const filters = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      } as { page: number; limit: number; status?: string };
      if (typeof status === 'string' && status.length > 0) {
        filters.status = status;
      }

      const result = await this.clinicalService.listAppointments(req.userId!, req.userRole!, filters);

      const response: ApiResponse = {
        success: true,
        message: 'Appointments retrieved successfully',
        data: {
          data: result.data,
          pagination: result.pagination
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error fetching appointments', req);
    }
  };

  public getAppointmentDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointmentId = this.requireParam(req, 'id');
      const appointment = await this.clinicalService.getAppointmentDetails(
        req.userId!,
        req.userRole!,
        appointmentId
      );

      const response: ApiResponse = {
        success: true,
        message: 'Appointment retrieved successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error fetching appointment details', req);
    }
  };

  public startEncounter = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointmentId = this.requireParam(req, 'id');
      const encounter = await this.clinicalService.startEncounter(
        req.userId!,
        req.userRole!,
        appointmentId
      );

      const response: ApiResponse = {
        success: true,
        message: 'Encounter started successfully',
        data: encounter,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error starting encounter', req);
    }
  };

  public recordVitals = async (req: Request, res: Response): Promise<void> => {
    try {
      const encounterId = this.requireParam(req, 'id');
      const parsed = clinicalVitalsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid vital signs data',
          error: parsed.error.flatten(),
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const vitals = await this.clinicalService.recordVitals(req.userId!, encounterId, parsed.data);

      const response: ApiResponse = {
        success: true,
        message: 'Vital signs recorded successfully',
        data: vitals,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error recording vital signs', req);
    }
  };

  public addEncounterNotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const encounterId = this.requireParam(req, 'id');
      const parsed = encounterNotesSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid encounter notes',
          error: parsed.error.flatten(),
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const encounter = await this.clinicalService.addEncounterNotes(
        req.userId!,
        encounterId,
        parsed.data
      );

      const response: ApiResponse = {
        success: true,
        message: 'Encounter notes saved successfully',
        data: encounter,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error saving encounter notes', req);
    }
  };

  public finishEncounter = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointmentId = this.requireParam(req, 'id');
      const parsed = clinicalFinishSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid clinical payload',
          error: parsed.error.flatten(),
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const result = await this.clinicalService.finishEncounter(
        req.userId!,
        req.userRole!,
        appointmentId,
        parsed.data
      );

      const response: ApiResponse = {
        success: true,
        message: result.alreadyCompleted ? 'Appointment already completed' : 'Encounter completed successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error finishing encounter', req);
    }
  };

  public createMedicalRecordByEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = clinicalRecordByEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid clinical record payload',
          error: parsed.error.flatten(),
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const result = await this.clinicalService.createMedicalRecordByEmail(
        req.userId!,
        req.userRole!,
        parsed.data
      );

      const response: ApiResponse = {
        success: true,
        message: 'Medical record created successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(201).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error creating medical record', req);
    }
  };

  public getMedicalRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const recordId = this.requireParam(req, 'id');
      const record = await this.clinicalService.getMedicalRecord(req.userId!, req.userRole!, recordId);
      const response: ApiResponse = {
        success: true,
        message: 'Medical record retrieved successfully',
        data: record,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error fetching medical record', req);
    }
  };

  public getPrescription = async (req: Request, res: Response): Promise<void> => {
    try {
      const prescriptionId = this.requireParam(req, 'id');
      const prescription = await this.clinicalService.getPrescription(req.userId!, req.userRole!, prescriptionId);
      const response: ApiResponse = {
        success: true,
        message: 'Prescription retrieved successfully',
        data: prescription,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error fetching prescription', req);
    }
  };

  public getPatientHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const patientHistory = await this.clinicalService.getPatientHistory(req.userId!);
      const response: ApiResponse = {
        success: true,
        message: 'Patient history retrieved successfully',
        data: patientHistory,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error, 'Error fetching patient history', req);
    }
  };

  public downloadMedicalRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const recordId = this.requireParam(req, 'id');
      const document = await this.clinicalService.getMedicalRecordDocument(
        req.userId!,
        req.userRole!,
        recordId
      );
      const absolutePath = path.resolve(process.cwd(), config.upload.uploadPath, document.filePath);
      res.download(absolutePath, document.fileName);
    } catch (error: any) {
      this.handleError(res, error, 'Error downloading medical record', req);
    }
  };

  public downloadPrescription = async (req: Request, res: Response): Promise<void> => {
    try {
      const prescriptionId = this.requireParam(req, 'id');
      const document = await this.clinicalService.getPrescriptionDocument(
        req.userId!,
        req.userRole!,
        prescriptionId
      );
      const absolutePath = path.resolve(process.cwd(), config.upload.uploadPath, document.filePath);
      res.download(absolutePath, document.fileName);
    } catch (error: any) {
      this.handleError(res, error, 'Error downloading prescription', req);
    }
  };

  private handleError(res: Response, error: any, fallbackMessage: string, req: Request): void {
    const statusCode = error.statusCode || 500;
    const response: ApiResponse = {
      success: false,
      message: error.message || fallbackMessage,
      error: error.details,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
    logger.error(fallbackMessage, error);
    res.status(statusCode).json(response);
  }

  private requireParam(req: Request, key: string): string {
    const value = req.params?.[key];
    if (!value) {
      const error = new Error(`Missing parameter: ${key}`) as Error & { statusCode?: number };
      error.statusCode = 400;
      throw error;
    }
    return value;
  }
}
