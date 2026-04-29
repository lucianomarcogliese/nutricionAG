-- CreateTable
CREATE TABLE "LandingContent" (
    "id" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandingContent_seccion_key" ON "LandingContent"("seccion");
