-- CreateEnum
CREATE TYPE "PatientConsentType" AS ENUM ('DATA_PROCESSING', 'EMAIL_DELIVERY', 'CLINICAL_HISTORY', 'TELEMEDICINE');

-- CreateEnum
CREATE TYPE "DocumentDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "RipsDraftStatus" AS ENUM ('DRAFT', 'VALIDATED', 'EXPORTED', 'FAILED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'DOWNLOAD';

-- CreateTable
CREATE TABLE "patient_consents" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "PatientConsentType" NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT NOT NULL DEFAULT 'PWA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_deliveries" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "medicalRecordId" TEXT,
    "prescriptionId" TEXT,
    "email" TEXT NOT NULL,
    "status" "DocumentDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "documents" JSONB,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_templates" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "requiredFields" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rips_drafts" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "RipsDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "errors" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rips_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_consents_patientId_type_version_key" ON "patient_consents"("patientId", "type", "version");

-- CreateIndex
CREATE INDEX "patient_consents_patientId_acceptedAt_idx" ON "patient_consents"("patientId", "acceptedAt");

-- CreateIndex
CREATE INDEX "document_deliveries_patientId_createdAt_idx" ON "document_deliveries"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "document_deliveries_appointmentId_status_idx" ON "document_deliveries"("appointmentId", "status");

-- CreateIndex
CREATE INDEX "document_deliveries_medicalRecordId_idx" ON "document_deliveries"("medicalRecordId");

-- CreateIndex
CREATE INDEX "document_deliveries_prescriptionId_idx" ON "document_deliveries"("prescriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_templates_serviceId_version_key" ON "clinical_templates"("serviceId", "version");

-- CreateIndex
CREATE INDEX "clinical_templates_serviceId_isActive_idx" ON "clinical_templates"("serviceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "rips_drafts_appointmentId_key" ON "rips_drafts"("appointmentId");

-- CreateIndex
CREATE INDEX "rips_drafts_status_generatedAt_idx" ON "rips_drafts"("status", "generatedAt");

-- AddForeignKey
ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_deliveries" ADD CONSTRAINT "document_deliveries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_deliveries" ADD CONSTRAINT "document_deliveries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_deliveries" ADD CONSTRAINT "document_deliveries_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_deliveries" ADD CONSTRAINT "document_deliveries_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_templates" ADD CONSTRAINT "clinical_templates_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rips_drafts" ADD CONSTRAINT "rips_drafts_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
