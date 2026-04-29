import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { getPermisos } from "@/lib/permisos"

type ConvRow = {
  id: string
  profileId: string
  nutricionistaId: string
  ultimoMensaje: Date
  createdAt: Date
  nutriNombre: string
  nutriColor: string
  nutriMatricula: string
  noLeidos: bigint
  ultimoContenido: string | null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const permisos = await getPermisos(session.user.id)
    if (!permisos.verMensajesPrivados) return NextResponse.json({ error: "REQUIERE_PRO" }, { status: 403 })

    const profileRows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM "Profile" WHERE "userId" = ${session.user.id} LIMIT 1`
    )
    if (!profileRows[0]) return NextResponse.json({ conversaciones: [] })
    const profileId = profileRows[0].id

    const rows = await prisma.$queryRaw<ConvRow[]>(
      Prisma.sql`
        SELECT
          c.id, c."profileId", c."nutricionistaId", c."ultimoMensaje", c."createdAt",
          n.nombre AS "nutriNombre", n.color AS "nutriColor", n.matricula AS "nutriMatricula",
          COUNT(m.id) FILTER (WHERE m.leido = false AND m."esNutricionista" = true) AS "noLeidos",
          (SELECT mp.contenido FROM "MensajePrivado" mp WHERE mp."conversacionId" = c.id ORDER BY mp."createdAt" DESC LIMIT 1) AS "ultimoContenido"
        FROM "Conversacion" c
        JOIN "Nutritionist" n ON n.id = c."nutricionistaId"
        LEFT JOIN "MensajePrivado" m ON m."conversacionId" = c.id
        WHERE c."profileId" = ${profileId}
        GROUP BY c.id, n.nombre, n.color, n.matricula
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
    console.error("GET /api/mensajes error:", error)
    return NextResponse.json({ error: "Error al obtener conversaciones" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const permisos = await getPermisos(session.user.id)
    if (!permisos.verMensajesPrivados) return NextResponse.json({ error: "REQUIERE_PRO" }, { status: 403 })

    const { nutricionistaId } = await req.json()
    if (!nutricionistaId) return NextResponse.json({ error: "nutricionistaId requerido" }, { status: 400 })

    const profileRows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM "Profile" WHERE "userId" = ${session.user.id} LIMIT 1`
    )
    if (!profileRows[0]) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    const profileId = profileRows[0].id

    const existing = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM "Conversacion" WHERE "profileId" = ${profileId} AND "nutricionistaId" = ${nutricionistaId} LIMIT 1`
    )

    if (existing[0]) return NextResponse.json({ conversacion: existing[0] })

    const id = `cm${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    const [conv] = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        INSERT INTO "Conversacion" (id, "profileId", "nutricionistaId", "ultimoMensaje", "createdAt")
        VALUES (${id}, ${profileId}, ${nutricionistaId}, NOW(), NOW())
        RETURNING id
      `
    )

    return NextResponse.json({ conversacion: conv }, { status: 201 })
  } catch (error) {
    console.error("POST /api/mensajes error:", error)
    return NextResponse.json({ error: "Error al crear conversación" }, { status: 500 })
  }
}
