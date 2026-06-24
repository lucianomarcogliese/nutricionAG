import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

type Params = { params: Promise<{ id: string }> }

// PATCH /api/admin/nutritionists/[id] — vincular usuario
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })

    const nutri = await prisma.nutritionist.findUnique({ where: { id } })
    if (!nutri) return NextResponse.json({ error: "Nutricionista no encontrado" }, { status: 404 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    if (user.role !== "USER") {
      return NextResponse.json({ error: "El usuario ya tiene un rol especial" }, { status: 400 })
    }

    // If already linked to another nutritionist, unlink first
    if (user.nutricionistaId && user.nutricionistaId !== id) {
      return NextResponse.json({ error: "El usuario ya está vinculado a otro nutricionista" }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { role: "NUTRICIONISTA", nutricionistaId: id },
      }),
    ])

    const nutritionist = await prisma.nutritionist.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })

    return NextResponse.json({ nutritionist })
  } catch (error) {
    logger.error("PATCH /api/admin/nutritionists/[id] error:", error)
    return NextResponse.json({ error: "Error al vincular usuario" }, { status: 500 })
  }
}

// DELETE /api/admin/nutritionists/[id] — eliminar nutricionista
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const nutri = await prisma.nutritionist.findUnique({
      where: { id },
      include: {
        conversaciones: { select: { id: true }, take: 1 },
        user: { select: { id: true } },
      },
    })
    if (!nutri) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    if (nutri.conversaciones.length > 0) {
      return NextResponse.json({ error: "No se puede eliminar: tiene conversaciones activas" }, { status: 409 })
    }

    // Reset linked user's role first
    if (nutri.user?.id) {
      await prisma.user.update({
        where: { id: nutri.user.id },
        data: { role: "USER", nutricionistaId: null },
      })
    }

    await prisma.nutritionist.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("DELETE /api/admin/nutritionists/[id] error:", error)
    return NextResponse.json({ error: "Error al eliminar nutricionista" }, { status: 500 })
  }
}
