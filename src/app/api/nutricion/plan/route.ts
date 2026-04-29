import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { getPermisos } from "@/lib/permisos"

async function getProfileId(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  })
  return profile?.id ?? null
}

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
    console.error("GET /api/nutricion/plan error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener el plan" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const rawCalories = body.caloriesTarget
    const caloriesTarget =
      rawCalories !== undefined && rawCalories !== "" && rawCalories !== null
        ? parseInt(String(rawCalories), 10)
        : null

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "El nombre no puede superar los 100 caracteres" }, { status: 400 })
    }
    if (caloriesTarget !== null && (isNaN(caloriesTarget) || caloriesTarget < 0 || caloriesTarget > 10000)) {
      return NextResponse.json({ error: "Objetivo calórico inválido (0–10000)" }, { status: 400 })
    }

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
    console.error("POST /api/nutricion/plan error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el plan" }, { status: 500 })
  }
}
