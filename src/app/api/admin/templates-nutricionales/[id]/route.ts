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
        include: {
          opciones: { orderBy: { orden: "asc" as const } },
        },
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
    const template = await prisma.templatePlan.findUnique({ where: { id }, include: FULL_INCLUDE })
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ template })
  } catch (error) {
    logger.error("GET /api/admin/templates-nutricionales/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener template" }, { status: 500 })
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

    type OpcionInput = { texto: string; orden: number }
    type GrupoInput = { nombre: string; orden: number; opciones: OpcionInput[] }
    type ComidaInput = { nombre: string; orden: number; nota?: string | null; ideasMenu?: string | null; grupos: GrupoInput[] }
    type Body = {
      nombre?: string
      objetivo?: ObjetivoPlan
      descripcion?: string | null
      recomendaciones?: string | null
      suplementos?: string | null
      comidas?: ComidaInput[]
    }

    const body = (await req.json()) as Body

    const existing = await prisma.templatePlan.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (body.objetivo && !VALID_OBJETIVOS.includes(body.objetivo)) {
      return NextResponse.json({ error: "objetivo inválido" }, { status: 400 })
    }

    // Full replace en transacción
    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar campos del template
      await tx.templatePlan.update({
        where: { id },
        data: {
          nombre: body.nombre?.trim() ?? existing.nombre,
          objetivo: body.objetivo ?? existing.objetivo,
          descripcion: body.descripcion !== undefined ? (body.descripcion?.trim() ?? null) : existing.descripcion,
          recomendaciones: body.recomendaciones !== undefined ? (body.recomendaciones?.trim() ?? null) : existing.recomendaciones,
          suplementos: body.suplementos !== undefined ? (body.suplementos?.trim() ?? null) : existing.suplementos,
        },
      })

      // Si se envían comidas, hacer full replace
      if (body.comidas !== undefined) {
        // Borrar todo lo existente (cascade borra grupos y opciones)
        await tx.templateComida.deleteMany({ where: { templateId: id } })

        // Recrear
        for (const comida of body.comidas) {
          const newComida = await tx.templateComida.create({
            data: { templateId: id, nombre: comida.nombre, orden: comida.orden, nota: comida.nota ?? null, ideasMenu: comida.ideasMenu ?? null },
          })
          for (const grupo of comida.grupos) {
            const newGrupo = await tx.templateGrupo.create({
              data: { comidaId: newComida.id, nombre: grupo.nombre, orden: grupo.orden },
            })
            if (grupo.opciones.length > 0) {
              await tx.templateOpcion.createMany({
                data: grupo.opciones.map((o) => ({ grupoId: newGrupo.id, texto: o.texto, orden: o.orden })),
              })
            }
          }
        }
      }

      return tx.templatePlan.findUnique({ where: { id }, include: FULL_INCLUDE })
    }, { timeout: 30000 })

    return NextResponse.json({ template: updated })
  } catch (error) {
    logger.error("PUT /api/admin/templates-nutricionales/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar template" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.templatePlan.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.templatePlan.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("DELETE /api/admin/templates-nutricionales/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar template" }, { status: 500 })
  }
}
