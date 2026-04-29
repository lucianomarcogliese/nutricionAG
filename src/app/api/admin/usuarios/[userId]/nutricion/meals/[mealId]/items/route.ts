import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { mealId } = await params

    const meal = await prisma.meal.findUnique({ where: { id: mealId } })
    if (!meal) return NextResponse.json({ error: "Comida no encontrada" }, { status: 404 })

    const { nombre, calorias, proteinas, carbos, grasas } = await req.json() as {
      nombre?: string
      calorias?: number | string
      proteinas?: number | string
      carbos?: number | string
      grasas?: number | string
    }

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const toDecimal = (v: number | string | undefined) =>
      v !== undefined && v !== "" ? Number(v) : null

    const item = await prisma.foodItem.create({
      data: {
        mealId,
        name: nombre.trim(),
        calories: toDecimal(calorias),
        proteinG: toDecimal(proteinas),
        carbsG: toDecimal(carbos),
        fatG: toDecimal(grasas),
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("POST items error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear alimento" }, { status: 500 })
  }
}
