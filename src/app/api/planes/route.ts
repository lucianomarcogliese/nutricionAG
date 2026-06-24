import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensurePlanSeed } from "@/lib/plan-seed"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    await ensurePlanSeed()

    const planes = await prisma.planConfig.findMany({
      where: { activo: true },
      orderBy: { precioARS: "asc" },
    })

    return NextResponse.json({ planes })
  } catch (error) {
    logger.error("GET /api/planes error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 })
  }
}
