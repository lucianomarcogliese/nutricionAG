import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plan = await prisma.planEntrenamiento.findFirst({
      where: { profile: { userId: session.user.id } },
      orderBy: { creadoEn: "desc" },
      include: {
        dias: {
          orderBy: { numero: "asc" },
          include: {
            ejercicios: {
              orderBy: { orden: "asc" },
              include: { ejercicio: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ plan: plan ?? null })
  } catch (error) {
    console.error("GET /api/entrenamiento-plan error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener plan" }, { status: 500 })
  }
}
