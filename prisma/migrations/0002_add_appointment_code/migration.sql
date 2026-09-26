-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "code" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_code_key" ON "Appointment"("code");
