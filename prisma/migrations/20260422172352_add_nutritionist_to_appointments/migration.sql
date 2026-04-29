-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "nutricionistaId" TEXT;

-- CreateTable
CREATE TABLE "Nutritionist" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "especialidades" TEXT[],
    "color" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nutritionist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nutritionist_matricula_key" ON "Nutritionist"("matricula");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_nutricionistaId_fkey" FOREIGN KEY ("nutricionistaId") REFERENCES "Nutritionist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
