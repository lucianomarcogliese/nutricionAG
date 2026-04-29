// REMOVER EN PRODUCCIÓN
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const passwordHash = await hash("password123", 12)

    // ── 2 Pacientes ──────────────────────────────────────────────────────────

    const pacientes = [
      { name: "María González", email: "maria@paciente.com" },
      { name: "Carlos Rodríguez", email: "carlos@paciente.com" },
    ]

    for (const p of pacientes) {
      const existing = await prisma.user.findUnique({ where: { email: p.email } })
      if (!existing) {
        const user = await prisma.user.create({
          data: { name: p.name, email: p.email, passwordHash, role: "USER" },
        })
        await prisma.profile.create({
          data: { userId: user.id, fullName: p.name },
        })
      }
    }

    // ── 2 Nutricionistas ─────────────────────────────────────────────────────

    const nutricionistas = [
      {
        user: { name: "Dra. Laura Méndez", email: "laura@nutri.com" },
        nutri: { nombre: "Laura Méndez", matricula: "MN-5001", color: "#10b981", especialidades: ["Nutrición clínica", "Deportiva"] },
      },
      {
        user: { name: "Lic. Martín Suárez", email: "martin@nutri.com" },
        nutri: { nombre: "Martín Suárez", matricula: "MN-5002", color: "#6366f1", especialidades: ["Nutrición infantil", "Vegana"] },
      },
    ]

    for (const n of nutricionistas) {
      const existing = await prisma.user.findUnique({ where: { email: n.user.email } })
      if (!existing) {
        // Crear el registro Nutritionist
        const nutri = await prisma.nutritionist.create({
          data: {
            nombre: n.nutri.nombre,
            matricula: n.nutri.matricula,
            color: n.nutri.color,
            especialidades: n.nutri.especialidades,
            activo: true,
          },
        })

        // Crear el User y vincularlo
        const user = await prisma.user.create({
          data: {
            name: n.user.name,
            email: n.user.email,
            passwordHash,
            role: "NUTRICIONISTA",
            nutricionistaId: nutri.id,
          },
        })

        // Crear perfil básico
        await prisma.profile.create({
          data: { userId: user.id, fullName: n.user.name },
        })
      }
    }

    return NextResponse.json({
      ok: true,
      pacientes: pacientes.map((p) => ({ email: p.email, password: "password123" })),
      nutricionistas: nutricionistas.map((n) => ({ email: n.user.email, password: "password123" })),
    })
  } catch (error) {
    console.error("seed-users error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
