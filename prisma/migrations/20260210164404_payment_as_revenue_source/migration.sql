/*
  Warnings:

  - You are about to drop the `FinanceRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'SUPPLIES', 'UTILITIES', 'MAINTENANCE', 'SALARY', 'OTHER');

-- DropForeignKey
ALTER TABLE "FinanceRecord" DROP CONSTRAINT "FinanceRecord_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "FinanceRecord" DROP CONSTRAINT "FinanceRecord_barberId_fkey";

-- DropForeignKey
ALTER TABLE "FinanceRecord" DROP CONSTRAINT "FinanceRecord_clientId_fkey";

-- DropForeignKey
ALTER TABLE "FinanceRecord" DROP CONSTRAINT "FinanceRecord_establishmentId_fkey";

-- DropForeignKey
ALTER TABLE "FinanceRecord" DROP CONSTRAINT "FinanceRecord_serviceId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "platformFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "FinanceRecord";

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "barberId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_establishmentId_date_idx" ON "Expense"("establishmentId", "date");

-- CreateIndex
CREATE INDEX "Expense_barberId_date_idx" ON "Expense"("barberId", "date");

-- CreateIndex
CREATE INDEX "Expense_category_date_idx" ON "Expense"("category", "date");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
