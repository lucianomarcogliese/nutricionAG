-- CreateTable
CREATE TABLE "Descuento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "logoUrl" TEXT,
    "imagenUrl" TEXT,
    "codigo" TEXT,
    "porcentaje" INTEGER,
    "link" TEXT,
    "categoria" TEXT NOT NULL,
    "planMinimo" TEXT NOT NULL DEFAULT 'PRO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaVencimiento" TIMESTAMP(3),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Descuento_pkey" PRIMARY KEY ("id")
);
