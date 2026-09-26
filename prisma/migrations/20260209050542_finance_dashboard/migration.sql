-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('PERCENTAGE', 'FLAT', 'TIERED', 'HYBRID');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FinanceRecord" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "platformFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "platformFeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PlatformFeeConfig" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "feeType" "FeeType" NOT NULL DEFAULT 'PERCENTAGE',
    "percentageRate" DOUBLE PRECISION,
    "flatAmount" DOUBLE PRECISION,
    "minFee" DOUBLE PRECISION,
    "maxFee" DOUBLE PRECISION,
    "includesTips" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformFeeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformFeeConfig_establishmentId_isActive_effectiveFrom_idx" ON "PlatformFeeConfig"("establishmentId", "isActive", "effectiveFrom");

-- CreateIndex
CREATE INDEX "FinanceRecord_establishmentId_completedAt_idx" ON "FinanceRecord"("establishmentId", "completedAt");

-- CreateIndex
CREATE INDEX "FinanceRecord_serviceId_completedAt_idx" ON "FinanceRecord"("serviceId", "completedAt");

-- CreateIndex
CREATE INDEX "FinanceRecord_clientId_completedAt_idx" ON "FinanceRecord"("clientId", "completedAt");

-- AddForeignKey
ALTER TABLE "FinanceRecord" ADD CONSTRAINT "FinanceRecord_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRecord" ADD CONSTRAINT "FinanceRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformFeeConfig" ADD CONSTRAINT "PlatformFeeConfig_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
