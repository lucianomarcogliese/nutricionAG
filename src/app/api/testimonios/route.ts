import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50))
    const skip = (page - 1) * limit

    const [testimonios, total] = await Promise.all([
      prisma.testimonio.findMany({
        where: { activo: true },
        orderBy: { orden: "asc" },
        skip,
        take: limit,
      }),
      prisma.testimonio.count({ where: { activo: true } }),
    ])

    return NextResponse.json({
      testimonios,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    logger.error("GET /api/testimonios error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener testimonios" }, { status: 500 })
  }
}
