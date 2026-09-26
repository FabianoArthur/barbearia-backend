-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cancellationFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "cancellationFeeCharged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FinanceRecord" ADD COLUMN     "cancellationFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
