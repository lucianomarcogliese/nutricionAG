import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

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

    const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } })
    if (!profile) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const plan = await prisma.nutritionPlan.findFirst({
      where: { profileId: profile.id, isActive: true },
      select: { id: true, meals: { select: { id: true } } },
    })
    if (!plan) return NextResponse.json({ error: "No hay plan activo" }, { status: 404 })

    const { nombre, orden } = await req.json() as { nombre?: string; orden?: number }
    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const meal = await prisma.meal.create({
      data: {
        planId: plan.id,
        name: nombre.trim(),
        orderIndex: orden ?? plan.meals.length,
      },
      include: { foodItems: true },
    })

    return NextResponse.json({ meal }, { status: 201 })
  } catch (error) {
    logger.error("POST meals error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear comida" }, { status: 500 })
  }
}
