import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { getPermisos } from "@/lib/permisos"
import { pusherServer } from "@/lib/pusher"
import { logger } from "@/lib/logger"

type MensajeRow = {
  id: string
  contenido: string
  profileId: string
  createdAt: Date
  fullName: string | null
}

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const permisos = await getPermisos(session.user.id)
    if (!permisos.verChat) return NextResponse.json({ error: "REQUIERE_PRO" }, { status: 403 })

    const before = new URL(req.url).searchParams.get("before")
    let beforeDate: Date | null = null
    if (before) {
      beforeDate = new Date(before)
      if (isNaN(beforeDate.getTime())) {
        return NextResponse.json({ error: "Parámetro before inválido" }, { status: 400 })
      }
    }

    const rows = beforeDate
      ? await prisma.$queryRaw<MensajeRow[]>(
          Prisma.sql`
            SELECT m.id, m.contenido, m."profileId", m."createdAt", p."fullName"
            FROM "ChatMessage" m
            JOIN "Profile" p ON p.id = m."profileId"
            WHERE m."createdAt" < ${beforeDate}
            ORDER BY m."createdAt" DESC
            LIMIT ${PAGE_SIZE + 1}
          `
        )
      : await prisma.$queryRaw<MensajeRow[]>(
          Prisma.sql`
            SELECT m.id, m.contenido, m."profileId", m."createdAt", p."fullName"
            FROM "ChatMessage" m
            JOIN "Profile" p ON p.id = m."profileId"
            ORDER BY m."createdAt" DESC
            LIMIT ${PAGE_SIZE + 1}
          `
        )

    const hasMore = rows.length > PAGE_SIZE
    if (hasMore) rows.pop()
    rows.reverse()

    return NextResponse.json({ mensajes: rows, hasMore })
  } catch (error) {
    logger.error("GET /api/chat/mensajes error:", error)
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const permisos = await getPermisos(session.user.id)
    if (!permisos.verChat) return NextResponse.json({ error: "REQUIERE_PRO" }, { status: 403 })

    const body = await req.json()
    const contenido = (body.contenido ?? "").trim()
    if (!contenido) return NextResponse.json({ error: "Contenido requerido" }, { status: 400 })
    if (contenido.length > 500) return NextResponse.json({ error: "Máximo 500 caracteres" }, { status: 400 })

    const profileRows = await prisma.$queryRaw<{ id: string; fullName: string | null }[]>(
      Prisma.sql`SELECT id, "fullName" FROM "Profile" WHERE "userId" = ${session.user.id} LIMIT 1`
    )
    if (!profileRows[0]) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    const profile = profileRows[0]

    const [mensaje] = await prisma.$queryRaw<{ id: string; contenido: string; profileId: string; createdAt: Date }[]>(
      Prisma.sql`
        INSERT INTO "ChatMessage" (id, contenido, "profileId", "createdAt")
        VALUES (${`cm${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`}, ${contenido}, ${profile.id}, NOW())
        RETURNING *
      `
    )

    const nombre = profile.fullName ?? "Usuario"
    await pusherServer.trigger("chat-comunidad", "nuevo-mensaje", {
      id: mensaje.id,
      contenido: mensaje.contenido,
      createdAt: mensaje.createdAt,
      profileId: profile.id,
      autor: {
        nombre,
        inicial: nombre.charAt(0).toUpperCase(),
      },
    })

    return NextResponse.json({ mensaje: { ...mensaje, fullName: profile.fullName } }, { status: 201 })
  } catch (error) {
    logger.error("POST /api/chat/mensajes error:", error)
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 })
  }
}
