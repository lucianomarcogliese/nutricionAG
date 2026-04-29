import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, eid } = await params

    const routine = await getRoutineForUser(id, session.user.id)
    if (!routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 })
    }

    const exercise = await prisma.userExercise.findUnique({
      where: { id: eid },
    })
    if (!exercise || exercise.routineId !== id) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }

    await prisma.userExercise.delete({ where: { id: eid } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/entrenamientos/[id]/ejercicios/[eid] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar el ejercicio" }, { status: 500 })
  }
}
