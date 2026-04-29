import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const meal = await prisma.meal.findUnique({
      where: { id },
      include: { plan: { select: { profileId: true } } },
    })
    if (!meal || meal.plan.profileId !== profile.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await prisma.meal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/nutricion/meals/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar la comida" }, { status: 500 })
  }
}
