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

    const nutricionistas = await prisma.nutritionist.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, matricula: true, color: true, especialidades: true },
    })

    return NextResponse.json({ nutricionistas })
  } catch (error) {
    logger.error("GET /api/nutricionistas error:", error)
    return NextResponse.json({ error: "Error al obtener nutricionistas" }, { status: 500 })
  }
}
