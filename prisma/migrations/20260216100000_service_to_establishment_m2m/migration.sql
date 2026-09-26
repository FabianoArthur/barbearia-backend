-- Step 1: Add establishmentId column (nullable initially)
ALTER TABLE "Service" ADD COLUMN "establishmentId" TEXT;

-- Step 2: Populate establishmentId from barber's establishment
UPDATE "Service" s
SET "establishmentId" = b."establishmentId"
FROM "Barber" b
WHERE s."barberId" = b."id";

-- Step 3: Make establishmentId NOT NULL
ALTER TABLE "Service" ALTER COLUMN "establishmentId" SET NOT NULL;

-- Step 4: Create implicit many-to-many join table (_BarberToService)
CREATE TABLE "_BarberToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BarberToService_A_fkey" FOREIGN KEY ("A") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BarberToService_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 5: Create unique index on (A, B) and index on B (Prisma convention)
CREATE UNIQUE INDEX "_BarberToService_AB_unique" ON "_BarberToService"("A", "B");
CREATE INDEX "_BarberToService_B_index" ON "_BarberToService"("B");

-- Step 6: Populate join table from existing barberId relationships
INSERT INTO "_BarberToService" ("A", "B")
SELECT "barberId", "id" FROM "Service" WHERE "barberId" IS NOT NULL;

-- Step 7: Drop old FK constraint and barberId column
ALTER TABLE "Service" DROP CONSTRAINT "Service_barberId_fkey";
ALTER TABLE "Service" DROP COLUMN "barberId";

-- Step 8: Add FK for establishmentId
ALTER TABLE "Service" ADD CONSTRAINT "Service_establishmentId_fkey"
    FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
