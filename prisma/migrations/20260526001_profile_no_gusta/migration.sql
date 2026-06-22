-- Eliminar campo alergias y agregar noGusta en Profile
ALTER TABLE "Profile" DROP COLUMN "alergias";
ALTER TABLE "Profile" ADD COLUMN "noGusta" TEXT;
