import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; rutinaId: string; ejercicioId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, rutinaId, ejercicioId } = await params

    const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } })
    if (!profile) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const rutina = await prisma.userRoutine.findUnique({ where: { id: rutinaId } })
    if (!rutina || rutina.profileId !== profile.id) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 })
    }

    await prisma.userExercise.delete({ where: { id: ejercicioId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("DELETE ejercicio error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar ejercicio" }, { status: 500 })
  }
}
