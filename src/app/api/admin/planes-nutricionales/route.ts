import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await req.json()) as { templateId?: string; userId?: string; notaNutricionista?: string }
    if (!body.templateId || !body.userId) {
      return NextResponse.json({ error: "templateId y userId son requeridos" }, { status: 400 })
    }

    // Fetch template completo
    const template = await prisma.templatePlan.findUnique({
      where: { id: body.templateId },
      include: {
        comidas: {
          orderBy: { orden: "asc" },
          include: {
            grupos: {
              orderBy: { orden: "asc" },
              include: { opciones: { orderBy: { orden: "asc" } } },
            },
          },
        },
      },
    })
    if (!template) return NextResponse.json({ error: "Template no encontrado" }, { status: 404 })

    // Buscar o crear profile para este userId
    const profile = await prisma.profile.upsert({
      where: { userId: body.userId },
      create: { userId: body.userId },
      update: {},
      select: { id: true },
    })

    const plan = await prisma.$transaction(async (tx) => {
      // Eliminar plan anterior si existe
      await tx.planNutricional.deleteMany({ where: { profileId: profile.id } })

      // Crear copia independiente del template
      const newPlan = await tx.planNutricional.create({
        data: {
          profileId: profile.id,
          nombre: template.nombre,
          objetivo: template.objetivo,
          notaNutricionista: body.notaNutricionista?.trim() ?? null,
          recomendaciones: template.recomendaciones,
          suplementos: template.suplementos,
          fromTemplateId: template.id,
        },
      })

      for (const comida of template.comidas) {
        const newComida = await tx.planComida.create({
          data: { planId: newPlan.id, nombre: comida.nombre, orden: comida.orden, nota: comida.nota, ideasMenu: comida.ideasMenu },
        })
        for (const grupo of comida.grupos) {
          const newGrupo = await tx.planGrupo.create({
            data: { comidaId: newComida.id, nombre: grupo.nombre, orden: grupo.orden },
          })
          if (grupo.opciones.length > 0) {
            await tx.planOpcion.createMany({
              data: grupo.opciones.map((o) => ({ grupoId: newGrupo.id, texto: o.texto, orden: o.orden })),
            })
          }
        }
      }

      return tx.planNutricional.findUnique({
        where: { id: newPlan.id },
        include: {
          comidas: {
            orderBy: { orden: "asc" },
            include: { grupos: { orderBy: { orden: "asc" }, include: { opciones: { orderBy: { orden: "asc" } } } } },
          },
        },
      })
    }, { timeout: 30000 })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    logger.error("POST /api/admin/planes-nutricionales error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al asignar plan" }, { status: 500 })
  }
}
