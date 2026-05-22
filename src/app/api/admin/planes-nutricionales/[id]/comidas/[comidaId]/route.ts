import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string; comidaId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, comidaId } = await params

    const comida = await prisma.planComida.findUnique({ where: { id: comidaId } })
    if (!comida || comida.planId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = (await req.json()) as { nota?: string | null; ideasMenu?: string | null }

    const updated = await prisma.planComida.update({
      where: { id: comidaId },
      data: {
        nota: body.nota !== undefined ? (body.nota?.trim() ?? null) : comida.nota,
        ideasMenu: body.ideasMenu !== undefined ? (body.ideasMenu?.trim() ?? null) : comida.ideasMenu,
      },
    })

    return NextResponse.json({ comida: updated })
  } catch (error) {
    console.error("PUT /api/admin/planes-nutricionales/[id]/comidas/[comidaId] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar comida" }, { status: 500 })
  }
}
