import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { logger } from "@/lib/logger"

type ConvAdminRow = {
  id: string
  profileId: string
  nutricionistaId: string
  ultimoMensaje: Date
  createdAt: Date
  usuarioNombre: string | null
  nutriNombre: string
  nutriColor: string
  nutriMatricula: string
  noLeidos: bigint
  ultimoContenido: string | null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rows = await prisma.$queryRaw<ConvAdminRow[]>(
      Prisma.sql`
        SELECT
          c.id, c."profileId", c."nutricionistaId", c."ultimoMensaje", c."createdAt",
          p."fullName" AS "usuarioNombre",
          n.nombre AS "nutriNombre", n.color AS "nutriColor", n.matricula AS "nutriMatricula",
          COUNT(m.id) FILTER (WHERE m.leido = false AND m."esNutricionista" = false) AS "noLeidos",
          (SELECT mp.contenido FROM "MensajePrivado" mp WHERE mp."conversacionId" = c.id ORDER BY mp."createdAt" DESC LIMIT 1) AS "ultimoContenido"
        FROM "Conversacion" c
        JOIN "Profile" p ON p.id = c."profileId"
        JOIN "Nutritionist" n ON n.id = c."nutricionistaId"
        LEFT JOIN "MensajePrivado" m ON m."conversacionId" = c.id
        GROUP BY c.id, p."fullName", n.nombre, n.color, n.matricula
        ORDER BY c."ultimoMensaje" DESC
      `
    )

    const conversaciones = rows.map((r) => ({
      ...r,
      noLeidos: Number(r.noLeidos),
      ultimoMensaje: r.ultimoMensaje.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }))

    return NextResponse.json({ conversaciones })
  } catch (error) {
    logger.error("GET /api/admin/mensajes error:", error)
    return NextResponse.json({ error: "Error al obtener conversaciones" }, { status: 500 })
  }
}
