import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { pusherServer } from "@/lib/pusher"
import { getProfileId } from "@/lib/profile-utils"
import { logger } from "@/lib/logger"

type MsgRow = {
  id: string
  conversacionId: string
  contenido: string
  autorId: string
  esNutricionista: boolean
  leido: boolean
  createdAt: Date
}

async function getConversacion(conversacionId: string) {
  const rows = await prisma.$queryRaw<{ id: string; profileId: string; nutricionistaId: string }[]>(
    Prisma.sql`SELECT id, "profileId", "nutricionistaId" FROM "Conversacion" WHERE id = ${conversacionId} LIMIT 1`
  )
  return rows[0] ?? null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversacionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversacionId } = await params
    const conv = await getConversacion(conversacionId)
    if (!conv) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const profileId = await getProfileId(session.user.id)
    const isAdmin = session.user.role === "ADMIN"
    if (!isAdmin && conv.profileId !== profileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const PAGE_SIZE = 50
    const before = new URL(req.url).searchParams.get("before")
    let beforeDate: Date | null = null
    if (before) {
      beforeDate = new Date(before)
      if (isNaN(beforeDate.getTime())) {
        return NextResponse.json({ error: "Parámetro before inválido" }, { status: 400 })
      }
    }

    const rows = beforeDate
      ? await prisma.$queryRaw<MsgRow[]>(
          Prisma.sql`
            SELECT id, "conversacionId", contenido, "autorId", "esNutricionista", leido, "createdAt"
            FROM "MensajePrivado"
            WHERE "conversacionId" = ${conversacionId} AND "createdAt" < ${beforeDate}
            ORDER BY "createdAt" DESC
            LIMIT ${PAGE_SIZE + 1}
          `
        )
      : await prisma.$queryRaw<MsgRow[]>(
          Prisma.sql`
            SELECT id, "conversacionId", contenido, "autorId", "esNutricionista", leido, "createdAt"
            FROM "MensajePrivado"
            WHERE "conversacionId" = ${conversacionId}
            ORDER BY "createdAt" DESC
            LIMIT ${PAGE_SIZE + 1}
          `
        )

    const hasMore = rows.length > PAGE_SIZE
    if (hasMore) rows.pop()
    rows.reverse()

    // Mark nutricionista messages as read for the user
    if (profileId && conv.profileId === profileId) {
      await prisma.$executeRaw(
        Prisma.sql`UPDATE "MensajePrivado" SET leido = true WHERE "conversacionId" = ${conversacionId} AND "esNutricionista" = true AND leido = false`
      )
    }

    return NextResponse.json({
      mensajes: rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      hasMore,
    })
  } catch (error) {
    logger.error("GET /api/mensajes/[conversacionId] error:", error)
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversacionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversacionId } = await params
    const conv = await getConversacion(conversacionId)
    if (!conv) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const profileId = await getProfileId(session.user.id)
    const isAdmin = session.user.role === "ADMIN"
    if (!isAdmin && conv.profileId !== profileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const contenido = (body.contenido ?? "").trim()
    if (!contenido) return NextResponse.json({ error: "Contenido requerido" }, { status: 400 })
    if (contenido.length > 500) return NextResponse.json({ error: "Máximo 500 caracteres" }, { status: 400 })

    const esNutricionista = isAdmin
    const id = `cm${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`

    const [mensaje] = await prisma.$queryRaw<MsgRow[]>(
      Prisma.sql`
        INSERT INTO "MensajePrivado" (id, "conversacionId", contenido, "autorId", "esNutricionista", leido, "createdAt")
        VALUES (${id}, ${conversacionId}, ${contenido}, ${session.user.id}, ${esNutricionista}, false, NOW())
        RETURNING *
      `
    )

    await prisma.$executeRaw(
      Prisma.sql`UPDATE "Conversacion" SET "ultimoMensaje" = NOW() WHERE id = ${conversacionId}`
    )

    await pusherServer.trigger(`private-privado-${conversacionId}`, "nuevo-mensaje", {
      id: mensaje.id,
      contenido: mensaje.contenido,
      autorId: mensaje.autorId,
      esNutricionista: mensaje.esNutricionista,
      createdAt: mensaje.createdAt,
    })

    return NextResponse.json({ mensaje: { ...mensaje, createdAt: mensaje.createdAt.toISOString() } }, { status: 201 })
  } catch (error) {
    logger.error("POST /api/mensajes/[conversacionId] error:", error)
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 })
  }
}
