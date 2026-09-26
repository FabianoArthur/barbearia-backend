-- DropIndex
DROP INDEX "idx_audit_log_entity";

-- AlterTable
ALTER TABLE "_BarberToService" ADD CONSTRAINT "_BarberToService_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BarberToService_AB_unique";

-- CreateIndex
CREATE INDEX "Appointment_establishmentId_status_startsAt_idx" ON "Appointment"("establishmentId", "status", "startsAt");
