import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

async function getPlanUsuario(userId: string): Promise<string> {
  const rows = await prisma.$queryRaw<{ plan: string; estado: string; fechaVencimiento: Date | null }[]>(
    Prisma.sql`
      SELECT s.plan, s.estado, s."fechaVencimiento"
      FROM "Subscription" s
      JOIN "Profile" p ON p.id = s."profileId"
      WHERE p."userId" = ${userId}
      LIMIT 1
    `
  )
  const sub = rows[0]
  if (!sub || sub.estado !== "ACTIVA") return "GRATIS"
  if (sub.fechaVencimiento && sub.fechaVencimiento < new Date()) return "GRATIS"
  return sub.plan ?? "GRATIS"
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const plan = await getPlanUsuario(session.user.id)
    if (plan === "GRATIS") {
      return NextResponse.json({ error: "REQUIERE_PRO" }, { status: 403 })
    }

    const planes = plan === "PREMIUM" ? ["PRO", "PREMIUM"] : ["PRO"]
    const rows = await prisma.$queryRaw<{ categoria: string }[]>(
      Prisma.sql`SELECT DISTINCT categoria FROM "Descuento" WHERE activo=true AND "planMinimo" = ANY(${planes}::text[]) ORDER BY categoria ASC`
    )

    return NextResponse.json({ categorias: rows.map((r) => r.categoria) })
  } catch (error) {
    console.error("GET /api/descuentos/categorias error:", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}
