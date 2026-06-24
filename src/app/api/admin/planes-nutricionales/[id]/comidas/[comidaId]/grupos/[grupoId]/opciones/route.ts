import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

type Params = { params: Promise<{ id: string; comidaId: string; grupoId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { grupoId } = await params
    const grupo = await prisma.planGrupo.findUnique({ where: { id: grupoId } })
    if (!grupo) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = (await req.json()) as { texto?: string; orden?: number }
    if (!body.texto?.trim()) return NextResponse.json({ error: "texto es requerido" }, { status: 400 })

    const maxOrden = await prisma.planOpcion.aggregate({ where: { grupoId }, _max: { orden: true } })
    const orden = body.orden ?? (maxOrden._max.orden ?? 0) + 1

    const opcion = await prisma.planOpcion.create({
      data: { grupoId, texto: body.texto.trim(), orden },
    })

    return NextResponse.json({ opcion }, { status: 201 })
  } catch (error) {
    logger.error("POST opciones error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al agregar opción" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { grupoId } = await params
    const body = (await req.json()) as { opcionId?: string; texto?: string }
    if (!body.opcionId || !body.texto?.trim()) {
      return NextResponse.json({ error: "opcionId y texto son requeridos" }, { status: 400 })
    }

    const opcion = await prisma.planOpcion.findUnique({ where: { id: body.opcionId } })
    if (!opcion || opcion.grupoId !== grupoId) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.planOpcion.update({
      where: { id: body.opcionId },
      data: { texto: body.texto.trim() },
    })

    return NextResponse.json({ opcion: updated })
  } catch (error) {
    logger.error("PUT opciones error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al editar opción" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { grupoId } = await params
    const body = (await req.json()) as { opcionId?: string }
    if (!body.opcionId) return NextResponse.json({ error: "opcionId es requerido" }, { status: 400 })

    const opcion = await prisma.planOpcion.findUnique({ where: { id: body.opcionId } })
    if (!opcion || opcion.grupoId !== grupoId) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.planOpcion.delete({ where: { id: body.opcionId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("DELETE opciones error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar opción" }, { status: 500 })
  }
}
