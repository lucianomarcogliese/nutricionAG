-- CreateEnum
CREATE TYPE "CategoriaEjercicio" AS ENUM ('PECHO', 'ESPALDA', 'PIERNAS', 'HOMBROS', 'BRAZOS', 'ABDOMEN', 'CARDIO', 'CUERPO_COMPLETO');

-- CreateTable
CREATE TABLE "Ejercicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "videoUrl" TEXT,
    "categoria" "CategoriaEjercicio" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ejercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanEntrenamiento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "profileId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanEntrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaEntrenamiento" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT,
    "planId" TEXT NOT NULL,

    CONSTRAINT "DiaEntrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EjercicioDia" (
    "id" TEXT NOT NULL,
    "diaId" TEXT NOT NULL,
    "ejercicioId" TEXT NOT NULL,
    "series" INTEGER,
    "repeticiones" TEXT,
    "descanso" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EjercicioDia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanEntrenamiento" ADD CONSTRAINT "PlanEntrenamiento_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaEntrenamiento" ADD CONSTRAINT "DiaEntrenamiento_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanEntrenamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EjercicioDia" ADD CONSTRAINT "EjercicioDia_diaId_fkey" FOREIGN KEY ("diaId") REFERENCES "DiaEntrenamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EjercicioDia" ADD CONSTRAINT "EjercicioDia_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "Ejercicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
