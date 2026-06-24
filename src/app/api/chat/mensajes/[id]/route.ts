import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { getProfileId } from "@/lib/profile-utils"
import { logger } from "@/lib/logger"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const rows = await prisma.$queryRaw<{ id: string; profileId: string }[]>(
      Prisma.sql`SELECT id, "profileId" FROM "ChatMessage" WHERE id = ${id} LIMIT 1`
    )
    if (!rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const profileId = await getProfileId(session.user.id)

    const isOwner = profileId === rows[0].profileId
    const isAdmin = session.user.role === "ADMIN"

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.$executeRaw(Prisma.sql`DELETE FROM "ChatMessage" WHERE id = ${id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("DELETE /api/chat/mensajes/[id] error:", error)
    return NextResponse.json({ error: "Error al eliminar mensaje" }, { status: 500 })
  }
}
