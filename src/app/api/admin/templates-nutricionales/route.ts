import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import type { ObjetivoPlan } from "@/generated/prisma/enums"
import { logger } from "@/lib/logger"

const VALID_OBJETIVOS: ObjetivoPlan[] = [
  "DEFICIT_CALORICO", "GANANCIA_MUSCULAR", "MANTENIMIENTO", "VEGETARIANO", "SIN_TACC", "PERSONALIZADO",
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const templates = await prisma.templatePlan.findMany({
      orderBy: { creadoEn: "asc" },
      include: {
        _count: { select: { comidas: true } },
      },
    })

    // Contar pacientes con plan asignado desde cada template
    const templateIds = templates.map((t) => t.id)
    const counts = await prisma.planNutricional.groupBy({
      by: ["fromTemplateId"],
      where: { fromTemplateId: { in: templateIds } },
      _count: { _all: true },
    })
    const countMap = Object.fromEntries(counts.map((c) => [c.fromTemplateId!, c._count._all]))

    const result = templates.map((t) => ({
      ...t,
      pacientesCount: countMap[t.id] ?? 0,
    }))

    return NextResponse.json({ templates: result })
  } catch (error) {
    logger.error("GET /api/admin/templates-nutricionales error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener templates" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await req.json()) as { nombre?: string; objetivo?: ObjetivoPlan; descripcion?: string }
    if (!body.nombre?.trim() || !body.objetivo || !VALID_OBJETIVOS.includes(body.objetivo)) {
      return NextResponse.json({ error: "nombre y objetivo son requeridos" }, { status: 400 })
    }

    const template = await prisma.templatePlan.create({
      data: {
        nombre: body.nombre.trim(),
        objetivo: body.objetivo,
        descripcion: body.descripcion?.trim() ?? null,
      },
      include: { _count: { select: { comidas: true } } },
    })

    return NextResponse.json({ template: { ...template, pacientesCount: 0 } }, { status: 201 })
  } catch (error) {
    logger.error("POST /api/admin/templates-nutricionales error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear template" }, { status: 500 })
  }
}
