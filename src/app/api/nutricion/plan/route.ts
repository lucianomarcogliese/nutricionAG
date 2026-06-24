import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { getPermisos } from "@/lib/permisos"
import { nutricionPlanSchema } from "@/lib/schemas/nutricionPlanSchema"
import { getProfileId } from "@/lib/profile-utils"
import { logger } from "@/lib/logger"

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profileId = await getProfileId(session.user.id)
    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const plan = await prisma.nutritionPlan.findFirst({
      where: { profileId, isActive: true },
      include: {
        meals: {
          orderBy: { orderIndex: "asc" },
          include: { foodItems: true },
        },
      },
    })

    return NextResponse.json({ plan: plan ?? null })
  } catch (error) {
    logger.error("GET /api/nutricion/plan error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener el plan" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== "NUTRICIONISTA" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const profileId = await getProfileId(session.user.id)
    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const permisos = await getPermisos(session.user.id)
    if (permisos.maxPlanes !== -1) {
      const count = await prisma.nutritionPlan.count({ where: { profileId } })
      if (count >= permisos.maxPlanes) {
        return NextResponse.json(
          { error: "LIMITE_PLANES", mensaje: "Tu plan no permite más planes nutricionales" },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    const result = nutricionPlanSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { name, caloriesTarget = null } = result.data

    await prisma.nutritionPlan.updateMany({
      where: { profileId, isActive: true },
      data: { isActive: false },
    })

    const plan = await prisma.nutritionPlan.create({
      data: { profileId, name, caloriesTarget, isActive: true },
      include: { meals: { include: { foodItems: true } } },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    logger.error("POST /api/nutricion/plan error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el plan" }, { status: 500 })
  }
}
