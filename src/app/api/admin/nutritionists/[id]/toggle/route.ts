import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const nutri = await prisma.nutritionist.findUnique({ where: { id }, select: { activo: true } })
    if (!nutri) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const updated = await prisma.nutritionist.update({
      where: { id },
      data: { activo: !nutri.activo },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })

    return NextResponse.json({ nutritionist: updated })
  } catch (error) {
    logger.error("PATCH /api/admin/nutritionists/[id]/toggle error:", error)
    return NextResponse.json({ error: "Error al cambiar estado" }, { status: 500 })
  }
}
