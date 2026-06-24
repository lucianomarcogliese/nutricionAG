import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

async function getRoutineForUser(routineId: string, userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!profile) return null

  const routine = await prisma.userRoutine.findUnique({
    where: { id: routineId },
  })
  if (!routine || routine.profileId !== profile.id) return null

  return routine
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const routine = await getRoutineForUser(id, session.user.id)
    if (!routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 })
    }

    const exercises = await prisma.userExercise.findMany({
      where: { routineId: id },
      orderBy: { orderIndex: "asc" },
    })

    return NextResponse.json({ exercises })
  } catch (error) {
    logger.error("GET /api/entrenamientos/[id]/ejercicios error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener ejercicios" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const routine = await getRoutineForUser(id, session.user.id)
    if (!routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 })
    }

    const body = await req.json()
    const { name, sets, reps, orderIndex } = body

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof sets !== "number" ||
      typeof reps !== "number" ||
      typeof orderIndex !== "number"
    ) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (
      !Number.isInteger(sets) || sets <= 0 ||
      !Number.isInteger(reps) || reps <= 0 ||
      !Number.isInteger(orderIndex) || orderIndex < 0
    ) {
      return NextResponse.json(
        { error: "sets, reps y orderIndex deben ser enteros positivos" },
        { status: 400 }
      )
    }

    const exercise = await prisma.userExercise.create({
      data: {
        routineId: id,
        name: name.trim(),
        sets,
        reps,
        orderIndex,
      },
    })

    return NextResponse.json({ exercise }, { status: 201 })
  } catch (error) {
    logger.error("POST /api/entrenamientos/[id]/ejercicios error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el ejercicio" }, { status: 500 })
  }
}
