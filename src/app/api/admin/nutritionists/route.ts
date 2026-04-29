import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { ensureNutritionistSeed } from "@/lib/nutritionist-seed"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "NUTRICIONISTA" && session.user.role !== "RECEPCIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await ensureNutritionistSeed()

    const nutritionists = await prisma.nutritionist.findMany({
      orderBy: { nombre: "asc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    return NextResponse.json({ nutritionists })
  } catch (error) {
    console.error("GET /api/admin/nutritionists error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener nutricionistas" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { nombre, matricula, especialidades, color } = body

    if (!nombre?.trim() || !matricula?.trim() || !color?.trim()) {
      return NextResponse.json({ error: "nombre, matricula y color son requeridos" }, { status: 400 })
    }

    const nutritionist = await prisma.nutritionist.create({
      data: {
        nombre: nombre.trim(),
        matricula: matricula.trim(),
        especialidades: Array.isArray(especialidades) ? especialidades : [],
        color: color.trim(),
        activo: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json({ nutritionist }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/nutritionists error:", error)
    return NextResponse.json({ error: "Error al crear nutricionista" }, { status: 500 })
  }
}
