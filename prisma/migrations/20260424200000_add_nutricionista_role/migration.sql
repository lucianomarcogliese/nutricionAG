-- Add NUTRICIONISTA to Role enum
ALTER TYPE "Role" ADD VALUE 'NUTRICIONISTA';

-- Add nutricionistaId column to User
ALTER TABLE "User" ADD COLUMN "nutricionistaId" TEXT;

-- Add unique constraint
ALTER TABLE "User" ADD CONSTRAINT "User_nutricionistaId_key" UNIQUE ("nutricionistaId");

-- Add foreign key
ALTER TABLE "User" ADD CONSTRAINT "User_nutricionistaId_fkey" FOREIGN KEY ("nutricionistaId") REFERENCES "Nutritionist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
