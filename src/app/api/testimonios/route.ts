import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const testimonios = await prisma.testimonio.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    })
    return NextResponse.json({ testimonios })
  } catch (error) {
    console.error("GET /api/testimonios error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener testimonios" }, { status: 500 })
  }
}
