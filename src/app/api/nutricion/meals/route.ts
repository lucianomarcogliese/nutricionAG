import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const plan = await prisma.nutritionPlan.findFirst({
      where: { profileId: profile.id, isActive: true },
      select: { id: true },
    })
    if (!plan) {
      return NextResponse.json({ error: "No hay plan activo" }, { status: 404 })
    }

    const body = await req.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const orderIndex = typeof body.orderIndex === "number" ? body.orderIndex : 0

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const meal = await prisma.meal.create({
      data: { planId: plan.id, name, orderIndex },
      include: { foodItems: true },
    })

    return NextResponse.json({ meal }, { status: 201 })
  } catch (error) {
    logger.error("POST /api/nutricion/meals error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear la comida" }, { status: 500 })
  }
}
