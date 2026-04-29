-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "activityLevel" "ActivityLevel",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "dietaryRestrictions" TEXT[],
ADD COLUMN     "goal" "Goal",
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sex" "Sex",
ADD COLUMN     "weightKg" DOUBLE PRECISION;
