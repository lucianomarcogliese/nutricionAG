import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

type Params = { params: Promise<{ userId: string }> }

const FULL_INCLUDE = {
  comidas: {
    orderBy: { orden: "asc" as const },
    include: {
      grupos: {
        orderBy: { orden: "asc" as const },
        include: { opciones: { orderBy: { orden: "asc" as const } } },
      },
    },
  },
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params

    const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } })
    if (!profile) return NextResponse.json({ plan: null })

    const plan = await prisma.planNutricional.findFirst({
      where: { profileId: profile.id },
      orderBy: { creadoEn: "desc" },
      include: FULL_INCLUDE,
    })

    return NextResponse.json({ plan: plan ?? null, profileId: profile.id })
  } catch (error) {
    logger.error("GET /api/admin/usuarios/[userId]/plan-nutricional error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener plan" }, { status: 500 })
  }
}
