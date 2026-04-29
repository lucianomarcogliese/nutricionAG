-- CreateTable
CREATE TABLE "Testimonio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "antesUrl" TEXT NOT NULL,
    "despuesUrl" TEXT NOT NULL,
    "kilos" DOUBLE PRECISION,
    "meses" INTEGER,
    "testimonio" TEXT,
    "objetivo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonio_pkey" PRIMARY KEY ("id")
);
