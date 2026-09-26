-- AlterTable: Add notes to Service
ALTER TABLE "Service" ADD COLUMN "notes" TEXT;

-- AlterTable: Add address to Establishment
ALTER TABLE "Establishment" ADD COLUMN "address" TEXT;

-- AlterTable: Add addressSnapshot to Appointment
ALTER TABLE "Appointment" ADD COLUMN "addressSnapshot" TEXT;
