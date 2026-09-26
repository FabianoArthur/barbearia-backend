-- CreateIndex
CREATE INDEX "Appointment_barberId_status_startsAt_endsAt_idx" ON "Appointment"("barberId", "status", "startsAt", "endsAt");
