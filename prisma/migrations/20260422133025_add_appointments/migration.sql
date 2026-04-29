-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('CONSULTA_NUTRICIONAL', 'SEGUIMIENTO', 'ANTROPOMETRIA', 'CONSULTA_DEPORTIVA');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER NOT NULL DEFAULT 60,
    "tipo" "AppointmentType" NOT NULL,
    "estado" "AppointmentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
