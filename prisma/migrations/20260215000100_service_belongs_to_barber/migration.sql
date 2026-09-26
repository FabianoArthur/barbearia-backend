-- Dev-only migration: Service ownership moves from Establishment to Barber
-- This migration truncates Service and Appointment tables (no production data)

-- Drop existing FK and column
ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS "Service_establishmentId_fkey";
ALTER TABLE "Service" DROP COLUMN IF EXISTS "establishmentId";

-- Add new barberId column and FK
ALTER TABLE "Service" ADD COLUMN "barberId" TEXT NOT NULL;
ALTER TABLE "Service" ADD CONSTRAINT "Service_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
