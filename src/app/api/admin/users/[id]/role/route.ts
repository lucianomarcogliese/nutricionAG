import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/client"

const ALLOWED_ROLES = Object.values(Role)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { role } = await req.json()

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
    }

    if (id === session.user.id) {
      return NextResponse.json({ error: "No podés cambiar tu propio rol" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const updated = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error("PATCH /api/admin/users/[id]/role error:", error)
    return NextResponse.json({ error: "Error al cambiar rol" }, { status: 500 })
  }
}
