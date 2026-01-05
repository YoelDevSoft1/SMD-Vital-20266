# ROADMAP CLINICO - Historias medicas, formulas y trazabilidad

## Objetivo
Permitir que doctores y enfermeras registren atencion clinica y que el sistema genere automaticamente historia medica y formula medica, con trazabilidad completa por servicio, y envio por email al paciente usando Resend (stack gratuito).

## Restricciones del stack (solo herramientas gratuitas)
- Backend: Node.js + TypeScript + Prisma + PostgreSQL + Redis + Bull (ya usados).
- Email: Resend (plan gratuito).
- PDF: libreria open-source (pdf-lib o pdfkit).
- Storage: filesystem local en Docker para PDFs (sin servicios pagos).
- UI: React/Vite existente.

## Alcance por rol
- DOCTOR: ver citas asignadas, capturar nota clinica, diagnostico, plan, prescripcion, finalizar cita.
- NURSE: ver citas asignadas, capturar signos vitales, procedimientos, insumos, observaciones, finalizar cita si aplica.
- PATIENT: ver su historial, descargar historia y formula, ver trazabilidad propia.
- ADMIN/SUPER_ADMIN: ver todo, auditoria, exportaciones.

## Modelo de datos (Prisma) - cambios propuestos
1) Appointment
   - agregar assignedNurseId (opcional)
   - agregar finishedAt, finishedById (usuario)
   - agregar completionHash o completionId (idempotencia)

2) Encounter (nuevo)
   - id, appointmentId (unique), patientId, doctorId, nurseId (opcional)
   - startedAt, finishedAt, status (IN_PROGRESS, COMPLETED)
   - summary (texto corto), templateVersion

3) VitalSign (nuevo)
   - id, encounterId, recordedById
   - bpSys, bpDia, hr, rr, temp, spo2, weight, height, notes, recordedAt

4) ServiceTrace (nuevo)
   - id, appointmentId, serviceId, actorId, actorRole
   - action, payloadJson, createdAt
   - objetivo: trazabilidad completa de acciones clinicas

5) MedicalRecord (extender)
   - agregar appointmentId, doctorId, nurseId, encounterId
   - agregar payloadJson (estructura clinica), pdfPath, templateVersion

6) Prescription (extender) + PrescriptionItem (nuevo)
   - Prescription: appointmentId, doctorId, patientId, pdfPath, status, notes
   - PrescriptionItem: medication, dosage, frequency, duration, instructions

7) AuditLog (nuevo)
   - actorId, role, entity, entityId, action, payloadJson, createdAt

## API y permisos
- /api/v1/clinical/appointments (doctor/nurse) -> solo sus citas
- /api/v1/clinical/appointments/:id -> detalle de cita asignada
- /api/v1/clinical/encounters/:id/vitals (nurse)
- /api/v1/clinical/encounters/:id/notes (doctor)
- /api/v1/clinical/encounters/:id/finish (doctor/nurse segun reglas)
- /api/v1/clinical/records/:id (doctor/nurse/patient con ownership)
- /api/v1/clinical/prescriptions/:id (doctor/patient con ownership)
- /api/v1/patient/history -> solo paciente autenticado
- /api/v1/admin/audit -> admin

Permisos:
- Filtros estrictos por userId/doctorId/patientId en todas las queries.
- Reglas de rol en middleware.

## Flujo robusto al finalizar cita (estado COMPLETED)
1) Validar que la cita pertenece al doctor/enfermera.
2) Validar campos obligatorios (segun rol y tipo de servicio).
3) Transaccion:
   - crear Encounter si no existe (idempotencia por appointmentId).
   - guardar VitalSign / notas clinicas / procedimientos.
   - crear MedicalRecord y Prescription (con payload estructurado).
   - registrar ServiceTrace y AuditLog.
   - actualizar Appointment.status = COMPLETED, finishedAt, finishedById.
4) Generar PDFs:
   - plantilla con logo, firmas y datos del paciente.
   - guardar archivos en /uploads/documents.
5) Encolar envio por email (Bull):
   - adjuntar PDFs (historia + formula).
6) Registrar trazabilidad de envio.

## Generacion de PDF con logo y firmas
- Plantillas versionadas (templateVersion en BD).
- Assets en repo (pendiente de ubicar):
  - /smd-vital-backend/assets/branding/logo.png
  - /smd-vital-backend/assets/branding/signature-doctor.png
  - /smd-vital-backend/assets/branding/signature-nurse.png
  - /smd-vital-backend/assets/branding/seal.png (opcional)
- Mock temporal creado en /smd-vital-backend/assets/branding (SVG) hasta recibir los finales.
- Servicio: DocumentService (pdf-lib o pdfkit).
- Campos obligatorios para render:
  - paciente, doctor/enfermera, servicio, fecha, notas, diagnostico, plan, prescripcion.

## Email con Resend (gratis)
- Reemplazar/expandir EmailService para usar Resend API.
- Variables env:
  - RESEND_API_KEY
  - FROM_EMAIL
  - APP_BASE_URL
- Nueva cola Bull: clinical-documents
- Retries y logs en AuditLog.

## Frontend (panel por rol)
- Routing por rol:
  - ADMIN/SUPER_ADMIN: panel completo actual.
  - DOCTOR: citas asignadas, formulario clinico, finalizar cita.
  - NURSE: citas asignadas, signos vitales, procedimientos.
  - PATIENT: historial propio y descarga de PDFs.
- Vistas nuevas:
  - ClinicalEncounterForm (doctor)
  - VitalsForm (nurse)
  - PatientHistory (patient)
- Manejo de 403 con UI clara.

## Validacion y calidad
- Zod schemas para payloads clinicos.
- Reglas de negocio: required fields por tipo de servicio.
- Idempotencia al finalizar cita (no duplicar docs).

## Migraciones y datos existentes
- Crear migraciones Prisma para nuevas tablas/campos.
- Script de backfill para citas antiguas (si aplica).
- Seed con datos de ejemplo para doctores/enfermeras/pacientes.

## Pruebas
- Unit tests: validacion clinica, PDF generation, Resend adapter.
- Integration tests: finalizar cita -> crea historia + formula + email en cola.
- E2E: doctor completa cita, paciente descarga PDF.

## Observabilidad
- Logs estructurados para trazabilidad.
- Metrics de PDF/email en /metrics.

## Pendientes del cliente
- Confirmar ubicacion real de logo y firmas.
- Confirmar campos obligatorios por servicio.
- Confirmar si enfermera puede finalizar cita sin doctor.
