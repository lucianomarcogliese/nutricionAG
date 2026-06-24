import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(
  _req: NextRequest,
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
      include: {
        meals: {
          orderBy: { orderIndex: "asc" },
          include: { foodItems: true },
        },
      },
    })

    return NextResponse.json({ plan: plan ?? null })
  } catch (error) {
    logger.error("GET nutricion error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener plan nutricional" }, { status: 500 })
  }
}
