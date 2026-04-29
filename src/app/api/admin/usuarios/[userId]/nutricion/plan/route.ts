import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

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

    const { nombre, objetivoCalorico } = await req.json() as {
      nombre?: string
      objetivoCalorico?: number | string
    }

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const caloriesTarget =
      objetivoCalorico !== undefined && objetivoCalorico !== ""
        ? parseInt(String(objetivoCalorico), 10)
        : null

    // Desactivar planes anteriores
    await prisma.nutritionPlan.updateMany({
      where: { profileId: profile.id, isActive: true },
      data: { isActive: false },
    })

    const plan = await prisma.nutritionPlan.create({
      data: {
        profileId: profile.id,
        name: nombre.trim(),
        caloriesTarget,
        isActive: true,
      },
      include: { meals: { include: { foodItems: true } } },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error("POST nutricion/plan error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear plan nutricional" }, { status: 500 })
  }
}
