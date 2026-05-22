-- CreateEnum
CREATE TYPE "ObjetivoPlan" AS ENUM ('DEFICIT_CALORICO', 'GANANCIA_MUSCULAR', 'MANTENIMIENTO', 'VEGETARIANO', 'SIN_TACC', 'PERSONALIZADO');

-- CreateTable
CREATE TABLE "TemplatePlan" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "objetivo" "ObjetivoPlan" NOT NULL,
    "recomendaciones" TEXT,
    "suplementos" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateComida" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "nota" TEXT,
    "ideasMenu" TEXT,

    CONSTRAINT "TemplateComida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateGrupo" (
    "id" TEXT NOT NULL,
    "comidaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "TemplateGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateOpcion" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "TemplateOpcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanNutricional" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" "ObjetivoPlan" NOT NULL,
    "notaNutricionista" TEXT,
    "recomendaciones" TEXT,
    "suplementos" TEXT,
    "fromTemplateId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanNutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanComida" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "nota" TEXT,
    "ideasMenu" TEXT,

    CONSTRAINT "PlanComida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanGrupo" (
    "id" TEXT NOT NULL,
    "comidaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "PlanGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanOpcion" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "PlanOpcion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TemplateComida" ADD CONSTRAINT "TemplateComida_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TemplatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateGrupo" ADD CONSTRAINT "TemplateGrupo_comidaId_fkey" FOREIGN KEY ("comidaId") REFERENCES "TemplateComida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateOpcion" ADD CONSTRAINT "TemplateOpcion_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "TemplateGrupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanNutricional" ADD CONSTRAINT "PlanNutricional_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanComida" ADD CONSTRAINT "PlanComida_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanNutricional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanGrupo" ADD CONSTRAINT "PlanGrupo_comidaId_fkey" FOREIGN KEY ("comidaId") REFERENCES "PlanComida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanOpcion" ADD CONSTRAINT "PlanOpcion_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "PlanGrupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
