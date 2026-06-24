import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

async function getProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  })
  return profile
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const profile = await getProfile(userId)
    if (!profile) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const rutinas = await prisma.userRoutine.findMany({
      where: { profileId: profile.id },
      include: { exercises: { orderBy: { orderIndex: "asc" } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ rutinas })
  } catch (error) {
    logger.error("GET rutinas error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener rutinas" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const profile = await getProfile(userId)
    if (!profile) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const { nombre, descripcion } = await req.json() as { nombre?: string; descripcion?: string }
    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const rutina = await prisma.userRoutine.create({
      data: { profileId: profile.id, name: nombre.trim(), description: descripcion ?? null },
      include: { exercises: true },
    })

    return NextResponse.json({ rutina }, { status: 201 })
  } catch (error) {
    logger.error("POST rutinas error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear rutina" }, { status: 500 })
  }
}
