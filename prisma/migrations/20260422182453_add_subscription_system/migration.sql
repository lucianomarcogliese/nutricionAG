-- CreateEnum
CREATE TYPE "PlanEstado" AS ENUM ('ACTIVA', 'VENCIDA', 'CANCELADA', 'PENDIENTE');

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_planId_fkey";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "estado" "PlanEstado" NOT NULL DEFAULT 'ACTIVA',
ADD COLUMN     "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fechaVencimiento" TIMESTAMP(3),
ADD COLUMN     "mpPaymentId" TEXT,
ADD COLUMN     "mpPreferenceId" TEXT,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'GRATIS',
ALTER COLUMN "planId" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PlanConfig" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "precioARS" DOUBLE PRECISION NOT NULL,
    "permisos" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanConfig_nombre_key" ON "PlanConfig"("nombre");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
