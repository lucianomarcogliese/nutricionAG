/**
 * Seed local de datos de prueba.
 * Solo para desarrollo — NO expone ningún endpoint HTTP.
 *
 * Uso:
 *   npm run seed
 *
 * Requiere .env.local con DATABASE_URL configurado.
 */

import { config } from "dotenv"
config({ path: ".env.local" })
config() // fallback a .env

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { hash } from "bcryptjs"

if (process.env.NODE_ENV === "production") {
  console.error("ERROR: Este script no debe ejecutarse en producción.")
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL no está definida. Revisá tu .env.local")
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await hash("password123", 12)

  // ── Pacientes ───────────────────────────────────────────────────────────────

  const pacientes = [
    { name: "María González", email: "maria@paciente.com" },
    { name: "Carlos Rodríguez", email: "carlos@paciente.com" },
  ]

  for (const p of pacientes) {
    const existing = await prisma.user.findUnique({ where: { email: p.email } })
    if (existing) {
      console.log(`  skip  ${p.email} (ya existe)`)
      continue
    }
    const user = await prisma.user.create({
      data: { name: p.name, email: p.email, passwordHash, role: "USER" },
    })
    await prisma.profile.create({
      data: { userId: user.id, fullName: p.name },
    })
    console.log(`  creado paciente: ${p.email}`)
  }

  // ── Nutricionistas ──────────────────────────────────────────────────────────

  const nutricionistas = [
    {
      user: { name: "Dra. Laura Méndez", email: "laura@nutri.com" },
      nutri: {
        nombre: "Laura Méndez",
        matricula: "MN-5001",
        color: "#10b981",
        especialidades: ["Nutrición clínica", "Deportiva"],
      },
    },
    {
      user: { name: "Lic. Martín Suárez", email: "martin@nutri.com" },
      nutri: {
        nombre: "Martín Suárez",
        matricula: "MN-5002",
        color: "#6366f1",
        especialidades: ["Nutrición infantil", "Vegana"],
      },
    },
  ]

  for (const n of nutricionistas) {
    const existing = await prisma.user.findUnique({ where: { email: n.user.email } })
    if (existing) {
      console.log(`  skip  ${n.user.email} (ya existe)`)
      continue
    }
    const nutri = await prisma.nutritionist.create({
      data: {
        nombre: n.nutri.nombre,
        matricula: n.nutri.matricula,
        color: n.nutri.color,
        especialidades: n.nutri.especialidades,
        activo: true,
      },
    })
    const user = await prisma.user.create({
      data: {
        name: n.user.name,
        email: n.user.email,
        passwordHash,
        role: "NUTRICIONISTA",
        nutricionistaId: nutri.id,
      },
    })
    await prisma.profile.create({
      data: { userId: user.id, fullName: n.user.name },
    })
    console.log(`  creado nutricionista: ${n.user.email}`)
  }

  console.log("\nCuentas de prueba (password: password123):")
  console.log("  maria@paciente.com  — paciente")
  console.log("  carlos@paciente.com — paciente")
  console.log("  laura@nutri.com     — nutricionista")
  console.log("  martin@nutri.com    — nutricionista")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
