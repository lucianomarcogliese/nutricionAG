import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; rutinaId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, rutinaId } = await params

    const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } })
    if (!profile) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const rutina = await prisma.userRoutine.findUnique({ where: { id: rutinaId } })
    if (!rutina || rutina.profileId !== profile.id) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 })
    }

    const { nombre, sets, reps, orden } = await req.json() as {
      nombre?: string
      sets?: number
      reps?: number
      orden?: number
    }

    if (!nombre?.trim() || !sets || !reps) {
      return NextResponse.json({ error: "nombre, sets y reps son requeridos" }, { status: 400 })
    }

    const ejercicio = await prisma.userExercise.create({
      data: {
        routineId: rutinaId,
        name: nombre.trim(),
        sets: Number(sets),
        reps: Number(reps),
        orderIndex: orden ?? 0,
      },
    })

    return NextResponse.json({ ejercicio }, { status: 201 })
  } catch (error) {
    logger.error("POST ejercicio error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear ejercicio" }, { status: 500 })
  }
}
