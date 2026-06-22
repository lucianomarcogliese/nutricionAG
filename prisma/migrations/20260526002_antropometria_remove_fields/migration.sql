-- Eliminar campos no utilizados en cálculos de Antropometria
ALTER TABLE "Antropometria" DROP COLUMN "cinturaMaxima";
ALTER TABLE "Antropometria" DROP COLUMN "pliegueAxilarMedio";
ALTER TABLE "Antropometria" DROP COLUMN "plieguePectoral";
