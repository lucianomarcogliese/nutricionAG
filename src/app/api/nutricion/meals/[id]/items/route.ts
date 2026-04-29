import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: mealId } = await params

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: { plan: { select: { profileId: true } } },
    })
    if (!meal || meal.plan.profileId !== profile.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const calories = body.calories !== undefined && body.calories !== "" ? parseFloat(body.calories) : null
    const proteinG = body.proteinG !== undefined && body.proteinG !== "" ? parseFloat(body.proteinG) : null
    const carbsG = body.carbsG !== undefined && body.carbsG !== "" ? parseFloat(body.carbsG) : null
    const fatG = body.fatG !== undefined && body.fatG !== "" ? parseFloat(body.fatG) : null

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }
    if (calories !== null && (isNaN(calories) || calories < 0 || calories > 5000)) {
      return NextResponse.json({ error: "Las calorías deben estar entre 0 y 5000" }, { status: 400 })
    }

    const item = await prisma.foodItem.create({
      data: { mealId, name, calories, proteinG, carbsG, fatG },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("POST /api/nutricion/meals/[id]/items error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al agregar el alimento" }, { status: 500 })
  }
}
