import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; mealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { mealId } = await params

    await prisma.meal.delete({ where: { id: mealId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("DELETE meal error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar comida" }, { status: 500 })
  }
}
