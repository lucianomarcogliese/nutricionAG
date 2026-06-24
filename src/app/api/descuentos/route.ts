import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { logger } from "@/lib/logger"

type DescuentoRow = {
  id: string; titulo: string; descripcion: string; marca: string
  logoUrl: string | null; imagenUrl: string | null; codigo: string | null
  porcentaje: number | null; link: string | null; categoria: string
  planMinimo: string; activo: boolean; fechaVencimiento: Date | null; orden: number
}

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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const plan = await getPlanUsuario(session.user.id)
    if (plan === "GRATIS") {
      return NextResponse.json(
        { error: "REQUIERE_PRO", mensaje: "Necesitás el plan Pro para acceder a descuentos exclusivos" },
        { status: 403 }
      )
    }

    const categoria = req.nextUrl.searchParams.get("categoria")?.trim()

    // PREMIUM ve todo, PRO solo ve planMinimo = 'PRO'
    const planes = plan === "PREMIUM" ? ["PRO", "PREMIUM"] : ["PRO"]

    let descuentos: DescuentoRow[]
    if (categoria) {
      descuentos = await prisma.$queryRaw<DescuentoRow[]>(
        Prisma.sql`SELECT * FROM "Descuento" WHERE activo=true AND "planMinimo" = ANY(${planes}::text[]) AND categoria=${categoria} ORDER BY orden ASC`
      )
    } else {
      descuentos = await prisma.$queryRaw<DescuentoRow[]>(
        Prisma.sql`SELECT * FROM "Descuento" WHERE activo=true AND "planMinimo" = ANY(${planes}::text[]) ORDER BY orden ASC`
      )
    }

    return NextResponse.json({ descuentos, plan })
  } catch (error) {
    logger.error("GET /api/descuentos error:", error)
    return NextResponse.json({ error: "Error al obtener descuentos" }, { status: 500 })
  }
}
