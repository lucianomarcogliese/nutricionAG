import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const nutri = await prisma.nutritionist.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    })
    if (!nutri) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    if (!nutri.user?.id) return NextResponse.json({ error: "No tiene usuario vinculado" }, { status: 400 })

    await prisma.user.update({
      where: { id: nutri.user.id },
      data: { role: "USER", nutricionistaId: null },
    })

    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })

    return NextResponse.json({ nutritionist })
  } catch (error) {
    console.error("DELETE /api/admin/nutritionists/[id]/unlink error:", error)
    return NextResponse.json({ error: "Error al desvincular usuario" }, { status: 500 })
  }
}
