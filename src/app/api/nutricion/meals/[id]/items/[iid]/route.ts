import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; iid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: mealId, iid } = await params

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const item = await prisma.foodItem.findUnique({
      where: { id: iid },
      include: {
        meal: { select: { id: true, plan: { select: { profileId: true } } } },
      },
    })
    if (!item || item.meal.id !== mealId || item.meal.plan.profileId !== profile.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await prisma.foodItem.delete({ where: { id: iid } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("DELETE .../items/[iid] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar el alimento" }, { status: 500 })
  }
}
