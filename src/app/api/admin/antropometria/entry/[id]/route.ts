import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    await prisma.antropometria.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/admin/antropometria/entry/[id] error:", error)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
