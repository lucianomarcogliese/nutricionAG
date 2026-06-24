import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { pusherServer } from "@/lib/pusher"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversacionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { conversacionId } = await params
    const body = await req.json()
    const contenido = (body.contenido ?? "").trim()
    if (!contenido) return NextResponse.json({ error: "Contenido requerido" }, { status: 400 })
    if (contenido.length > 500) return NextResponse.json({ error: "Máximo 500 caracteres" }, { status: 400 })

    const convRows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM "Conversacion" WHERE id = ${conversacionId} LIMIT 1`
    )
    if (!convRows[0]) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const id = `cm${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    const [mensaje] = await prisma.$queryRaw<{ id: string; contenido: string; autorId: string; esNutricionista: boolean; leido: boolean; createdAt: Date }[]>(
      Prisma.sql`
        INSERT INTO "MensajePrivado" (id, "conversacionId", contenido, "autorId", "esNutricionista", leido, "createdAt")
        VALUES (${id}, ${conversacionId}, ${contenido}, ${session.user.id}, true, false, NOW())
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
      esNutricionista: true,
      createdAt: mensaje.createdAt,
    })

    return NextResponse.json({ mensaje: { ...mensaje, createdAt: mensaje.createdAt.toISOString() } }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/mensajes/[conversacionId] error:", error)
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 })
  }
}
