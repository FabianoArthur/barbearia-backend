-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- CreateIndex (partial index for reminder recovery cron)
CREATE INDEX "idx_appointment_reminder" ON "Appointment" ("startsAt", "status")
WHERE "status" = 'CONFIRMED';
