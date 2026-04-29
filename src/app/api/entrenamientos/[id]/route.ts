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

export async function PATCH(
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
    const updateData: { name?: string; description?: string } = {}

    if (typeof body.name === "string") {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 })
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: "El nombre no puede superar los 100 caracteres" },
          { status: 400 }
        )
      }
      updateData.name = name
    }

    if (typeof body.description === "string") {
      updateData.description = body.description
    }

    const updated = await prisma.userRoutine.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ routine: updated })
  } catch (error) {
    console.error("PATCH /api/entrenamientos/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar la rutina" }, { status: 500 })
  }
}

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
    const routine = await getRoutineForUser(id, session.user.id)
    if (!routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 })
    }

    await prisma.userRoutine.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/entrenamientos/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar la rutina" }, { status: 500 })
  }
}
