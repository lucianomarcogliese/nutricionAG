-- Reestructuración de campos de Antropometría
-- Renames preservan datos existentes; se agregan columnas nuevas

-- Renombrar columnas existentes (preserva datos)
ALTER TABLE "Antropometria" RENAME COLUMN "cinturaCm" TO "cinturaMinima";
ALTER TABLE "Antropometria" RENAME COLUMN "caderaCm" TO "caderaMaxima";
ALTER TABLE "Antropometria" RENAME COLUMN "brazoCm" TO "brazoFlexionado";
ALTER TABLE "Antropometria" RENAME COLUMN "musloDerechoCm" TO "musloSuperior";
ALTER TABLE "Antropometria" RENAME COLUMN "pantorrillaDerechaCm" TO "pantorrillaMaxima";
ALTER TABLE "Antropometria" RENAME COLUMN "pliegueSuprailiaco" TO "pliegueSupraespinal";
ALTER TABLE "Antropometria" RENAME COLUMN "pliegueMusloAnterior" TO "pliegueMusloMedial";

-- Agregar columnas nuevas
ALTER TABLE "Antropometria" ADD COLUMN "tallaSentado" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "diametroBiacromial" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "diametroToraxTransverso" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "diametroToraxAnteroposterior" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "diametroBiiliocrestideo" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "perimetroCabeza" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "brazoRelajado" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "perimetroAntebrazo" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "toraxMesoesternal" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "cinturaMaxima" DOUBLE PRECISION;
ALTER TABLE "Antropometria" ADD COLUMN "musloMedial" DOUBLE PRECISION;
