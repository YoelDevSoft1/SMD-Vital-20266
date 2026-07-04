-- =====================================================================
-- Migration: add_billing_core
-- Billing Core: split 3 actores (Profesional / Agente / SMD Vital)
-- Tablas nuevas: service_margin_rules, margin_snapshots,
--                payment_acknowledgements, payout_batches, payout_batch_items
-- =====================================================================

-- 1) Nuevos valores en enums existentes
ALTER TYPE "UserRole" ADD VALUE 'AGENT';
ALTER TYPE "AppointmentStatus" ADD VALUE 'PARTIALLY_RECONCILED';
ALTER TYPE "AppointmentStatus" ADD VALUE 'RECONCILED';

-- 2) Nuevos enums
CREATE TYPE "AckStatus" AS ENUM ('PENDING', 'PAID', 'ACKNOWLEDGED', 'DISPUTED', 'CANCELLED');
CREATE TYPE "PayoutStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'CANCELLED');

-- 3) Nueva columna en services (rol requerido)
ALTER TABLE "services" ADD COLUMN "requiredRole" "UserRole" NOT NULL DEFAULT 'DOCTOR';

-- 4) Nueva columna en appointments (asesor que agendó)
ALTER TABLE "appointments" ADD COLUMN "bookedById" TEXT;

-- 5) Tabla: service_margin_rules
CREATE TABLE "service_margin_rules" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "professionalAmount" INTEGER NOT NULL,
    "agentAmount" INTEGER NOT NULL,
    "smdVitalAmount" INTEGER NOT NULL,
    "requiredRole" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "service_margin_rules_pkey" PRIMARY KEY ("id")
);

-- Unique: una regla activa por servicio
CREATE UNIQUE INDEX "service_margin_rules_serviceId_key" ON "service_margin_rules"("serviceId");

-- FK a services
ALTER TABLE "service_margin_rules" ADD CONSTRAINT "service_margin_rules_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6) Tabla: margin_snapshots
CREATE TABLE "margin_snapshots" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "professionalId" TEXT,
    "professionalRole" "UserRole",
    "professionalAmount" INTEGER NOT NULL,
    "agentId" TEXT,
    "agentRole" "UserRole",
    "agentAmount" INTEGER NOT NULL DEFAULT 0,
    "smdVitalAmount" INTEGER NOT NULL,
    "appliedRuleId" TEXT NOT NULL,
    "appliedRuleSnapshot" JSONB NOT NULL,
    "frozenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "margin_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "margin_snapshots_appointmentId_key" ON "margin_snapshots"("appointmentId");
CREATE INDEX "margin_snapshots_professionalId_idx" ON "margin_snapshots"("professionalId");
CREATE INDEX "margin_snapshots_agentId_idx" ON "margin_snapshots"("agentId");

ALTER TABLE "margin_snapshots" ADD CONSTRAINT "margin_snapshots_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7) Tabla: payment_acknowledgements
CREATE TABLE "payment_acknowledgements" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientRole" "UserRole" NOT NULL,
    "amount" INTEGER NOT NULL,
    "concept" TEXT NOT NULL,
    "status" "AckStatus" NOT NULL DEFAULT 'PENDING',
    "paidById" TEXT,
    "paidAt" TIMESTAMP(3),
    "paymentProof" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "disputedReason" TEXT,

    CONSTRAINT "payment_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- Un ack por destinatario por cita
CREATE UNIQUE INDEX "payment_acknowledgements_appointmentId_recipientId_key"
    ON "payment_acknowledgements"("appointmentId", "recipientId");

CREATE INDEX "payment_acknowledgements_recipientId_status_idx"
    ON "payment_acknowledgements"("recipientId", "status");

CREATE INDEX "payment_acknowledgements_status_paidAt_idx"
    ON "payment_acknowledgements"("status", "paidAt");

ALTER TABLE "payment_acknowledgements" ADD CONSTRAINT "payment_acknowledgements_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_acknowledgements" ADD CONSTRAINT "payment_acknowledgements_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8) Tabla: payout_batches
CREATE TABLE "payout_batches" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_batches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payout_batches_recipientId_periodStart_periodEnd_idx"
    ON "payout_batches"("recipientId", "periodStart", "periodEnd");

CREATE INDEX "payout_batches_status_periodEnd_idx"
    ON "payout_batches"("status", "periodEnd");

ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9) Tabla: payout_batch_items
CREATE TABLE "payout_batch_items" (
    "id" TEXT NOT NULL,
    "payoutBatchId" TEXT NOT NULL,
    "acknowledgementId" TEXT NOT NULL,

    CONSTRAINT "payout_batch_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payout_batch_items_acknowledgementId_key"
    ON "payout_batch_items"("acknowledgementId");

ALTER TABLE "payout_batch_items" ADD CONSTRAINT "payout_batch_items_payoutBatchId_fkey"
    FOREIGN KEY ("payoutBatchId") REFERENCES "payout_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payout_batch_items" ADD CONSTRAINT "payout_batch_items_acknowledgementId_fkey"
    FOREIGN KEY ("acknowledgementId") REFERENCES "payment_acknowledgements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10) FK en appointments.bookedById
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_bookedById_fkey"
    FOREIGN KEY ("bookedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
