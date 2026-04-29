-- CreateTable
CREATE TABLE "Conversacion" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "nutricionistaId" TEXT NOT NULL,
    "ultimoMensaje" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensajePrivado" (
    "id" TEXT NOT NULL,
    "conversacionId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "esNutricionista" BOOLEAN NOT NULL DEFAULT false,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensajePrivado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversacion_profileId_nutricionistaId_key" ON "Conversacion"("profileId", "nutricionistaId");

-- CreateIndex
CREATE INDEX "MensajePrivado_conversacionId_createdAt_idx" ON "MensajePrivado"("conversacionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Conversacion" ADD CONSTRAINT "Conversacion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversacion" ADD CONSTRAINT "Conversacion_nutricionistaId_fkey" FOREIGN KEY ("nutricionistaId") REFERENCES "Nutritionist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajePrivado" ADD CONSTRAINT "MensajePrivado_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "Conversacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
