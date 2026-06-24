import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import type { ObjetivoPlan } from "@/generated/prisma/enums"
import { logger } from "@/lib/logger"

type Params = { params: Promise<{ id: string }> }

const VALID_OBJETIVOS: ObjetivoPlan[] = [
  "DEFICIT_CALORICO", "GANANCIA_MUSCULAR", "MANTENIMIENTO", "VEGETARIANO", "SIN_TACC", "PERSONALIZADO",
]

const FULL_INCLUDE = {
  comidas: {
    orderBy: { orden: "asc" as const },
    include: {
      grupos: {
        orderBy: { orden: "asc" as const },
        include: { opciones: { orderBy: { orden: "asc" as const } } },
      },
    },
  },
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const plan = await prisma.planNutricional.findUnique({ where: { id }, include: FULL_INCLUDE })
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ plan })
  } catch (error) {
    logger.error("GET /api/admin/planes-nutricionales/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener plan" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.planNutricional.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = (await req.json()) as {
      nombre?: string
      objetivo?: ObjetivoPlan
      notaNutricionista?: string | null
      recomendaciones?: string | null
      suplementos?: string | null
    }

    if (body.objetivo && !VALID_OBJETIVOS.includes(body.objetivo)) {
      return NextResponse.json({ error: "objetivo inválido" }, { status: 400 })
    }

    const updated = await prisma.planNutricional.update({
      where: { id },
      data: {
        nombre: body.nombre?.trim() ?? existing.nombre,
        objetivo: body.objetivo ?? existing.objetivo,
        notaNutricionista: body.notaNutricionista !== undefined ? (body.notaNutricionista?.trim() ?? null) : existing.notaNutricionista,
        recomendaciones: body.recomendaciones !== undefined ? (body.recomendaciones?.trim() ?? null) : existing.recomendaciones,
        suplementos: body.suplementos !== undefined ? (body.suplementos?.trim() ?? null) : existing.suplementos,
      },
      include: FULL_INCLUDE,
    })

    return NextResponse.json({ plan: updated })
  } catch (error) {
    logger.error("PUT /api/admin/planes-nutricionales/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.planNutricional.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.planNutricional.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("DELETE /api/admin/planes-nutricionales/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 })
  }
}
