-- CreateTable
CREATE TABLE "Antropometria" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "nutricionistaId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pesoKg" DOUBLE PRECISION NOT NULL,
    "tallaCm" DOUBLE PRECISION NOT NULL,
    "cinturaCm" DOUBLE PRECISION,
    "caderaCm" DOUBLE PRECISION,
    "brazoCm" DOUBLE PRECISION,
    "musloDerechoCm" DOUBLE PRECISION,
    "pantorrillaDerechaCm" DOUBLE PRECISION,
    "pliegueSubescapular" DOUBLE PRECISION,
    "pliegueTriceps" DOUBLE PRECISION,
    "pliegueSuprailiaco" DOUBLE PRECISION,
    "pliegueAbdominal" DOUBLE PRECISION,
    "pliegueMusloAnterior" DOUBLE PRECISION,
    "plieguePantorrilla" DOUBLE PRECISION,
    "pliegueAxilarMedio" DOUBLE PRECISION,
    "plieguePectoral" DOUBLE PRECISION,
    "diametroBiepicondileoFemoral" DOUBLE PRECISION,
    "diametroBiepicondileoHumeral" DOUBLE PRECISION,
    "diametroMunieca" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "icc" DOUBLE PRECISION,
    "porcentajeGrasa" DOUBLE PRECISION,
    "masaGrasaKg" DOUBLE PRECISION,
    "masaMagraKg" DOUBLE PRECISION,
    "masaOseaKg" DOUBLE PRECISION,
    "masaMuscularKg" DOUBLE PRECISION,
    "endomorfismo" DOUBLE PRECISION,
    "mesomorfismo" DOUBLE PRECISION,
    "ectomorfismo" DOUBLE PRECISION,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Antropometria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Antropometria_profileId_fecha_idx" ON "Antropometria"("profileId", "fecha");

-- AddForeignKey
ALTER TABLE "Antropometria" ADD CONSTRAINT "Antropometria_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antropometria" ADD CONSTRAINT "Antropometria_nutricionistaId_fkey" FOREIGN KEY ("nutricionistaId") REFERENCES "Nutritionist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
