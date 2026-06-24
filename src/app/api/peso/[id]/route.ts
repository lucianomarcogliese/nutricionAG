import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { logger } from "@/lib/logger"

type WeightRow = { id: string; profileId: string }

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    const rows = await prisma.$queryRaw<WeightRow[]>(
      Prisma.sql`SELECT id, "profileId" FROM "WeightEntry" WHERE id = ${id}`
    )
    const entry = rows[0]
    if (!entry || entry.profileId !== profile.id) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    await prisma.$executeRaw(
      Prisma.sql`DELETE FROM "WeightEntry" WHERE id = ${id}`
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("DELETE /api/peso/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar registro" }, { status: 500 })
  }
}
