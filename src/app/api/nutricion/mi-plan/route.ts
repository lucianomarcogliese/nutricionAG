import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plan = await prisma.planNutricional.findFirst({
      where: { profile: { userId: session.user.id } },
      orderBy: { creadoEn: "desc" },
      include: {
        comidas: {
          orderBy: { orden: "asc" },
          include: {
            grupos: {
              orderBy: { orden: "asc" },
              include: { opciones: { orderBy: { orden: "asc" } } },
            },
          },
        },
      },
    })

    return NextResponse.json({ plan: plan ?? null })
  } catch (error) {
    logger.error("GET /api/nutricion/mi-plan error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener plan" }, { status: 500 })
  }
}
