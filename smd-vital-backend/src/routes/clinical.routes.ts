import { Router } from 'express';
import { ClinicalController } from '../controllers/clinical.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const clinicalController = new ClinicalController();

router.use(authMiddleware);

router.get('/availability', requireRole(['DOCTOR']), clinicalController.getMyAvailability);
router.put('/availability', requireRole(['DOCTOR']), clinicalController.setMyAvailability);
router.get('/route', requireRole(['DOCTOR']), clinicalController.getMyRoute);

router.get('/appointments', requireRole(['DOCTOR', 'NURSE']), clinicalController.getAssignedAppointments);
router.get('/appointments/:id', requireRole(['DOCTOR', 'NURSE']), clinicalController.getAppointmentDetails);
router.post('/appointments/:id/start', requireRole(['DOCTOR', 'NURSE']), clinicalController.startEncounter);
router.post('/appointments/:id/finish', requireRole(['DOCTOR', 'NURSE']), clinicalController.finishEncounter);

router.post('/encounters/:id/vitals', requireRole(['NURSE']), clinicalController.recordVitals);
router.post('/encounters/:id/notes', requireRole(['DOCTOR']), clinicalController.addEncounterNotes);

router.post('/records/by-email', requireRole(['DOCTOR', 'NURSE']), clinicalController.createMedicalRecordByEmail);
router.get('/records/:id', requireRole(['DOCTOR', 'NURSE', 'PATIENT']), clinicalController.getMedicalRecord);
router.get('/records/:id/document', requireRole(['DOCTOR', 'NURSE', 'PATIENT']), clinicalController.downloadMedicalRecord);

router.get('/prescriptions/:id', requireRole(['DOCTOR', 'NURSE', 'PATIENT']), clinicalController.getPrescription);
router.get('/prescriptions/:id/document', requireRole(['DOCTOR', 'NURSE', 'PATIENT']), clinicalController.downloadPrescription);

router.get('/patient/history', requireRole(['PATIENT']), clinicalController.getPatientHistory);

export default router;
