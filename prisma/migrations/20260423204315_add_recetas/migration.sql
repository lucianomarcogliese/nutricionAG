-- CreateTable
CREATE TABLE "Receta" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagenUrl" TEXT,
    "ingredientes" JSONB NOT NULL,
    "pasos" JSONB NOT NULL,
    "calorias" INTEGER,
    "proteinas" DOUBLE PRECISION,
    "carbos" DOUBLE PRECISION,
    "grasas" DOUBLE PRECISION,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaFavorita" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecetaFavorita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecetaFavorita_profileId_recetaId_key" ON "RecetaFavorita"("profileId", "recetaId");

-- AddForeignKey
ALTER TABLE "RecetaFavorita" ADD CONSTRAINT "RecetaFavorita_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaFavorita" ADD CONSTRAINT "RecetaFavorita_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
