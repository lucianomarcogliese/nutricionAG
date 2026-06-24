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

    const appointments = await prisma.appointment.findMany({
      where: { userId: session.user.id },
      include: {
        nutricionista: { select: { id: true, nombre: true, color: true, matricula: true } },
      },
      orderBy: { fecha: "asc" },
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    logger.error("GET /api/turnos error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener turnos" }, { status: 500 })
  }
}
