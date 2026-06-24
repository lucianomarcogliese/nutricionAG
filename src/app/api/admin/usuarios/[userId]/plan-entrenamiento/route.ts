import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

type Params = Promise<{ userId: string }>

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ plan: null })
    }

    const plan = await prisma.planEntrenamiento.findFirst({
      where: { profileId: profile.id },
      orderBy: { creadoEn: "desc" },
      include: {
        dias: {
          orderBy: { numero: "asc" },
          include: {
            ejercicios: {
              orderBy: { orden: "asc" },
              include: { ejercicio: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ plan: plan ?? null })
  } catch (error) {
    logger.error("GET plan-entrenamiento error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener plan" }, { status: 500 })
  }
}

interface EjercicioInput {
  ejercicioId: string
  series?: number
  repeticiones?: string
  descanso?: number
  orden: number
}

interface DiaInput {
  numero: number
  nombre?: string
  ejercicios: EjercicioInput[]
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const { nombre, descripcion, dias } = body as { nombre: string; descripcion?: string; dias: DiaInput[] }

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre del plan es requerido" }, { status: 400 })
    }
    if (!Array.isArray(dias) || dias.length === 0) {
      return NextResponse.json({ error: "El plan debe tener al menos un día" }, { status: 400 })
    }

    const plan = await prisma.$transaction(async (tx) => {
      // Eliminar plan anterior si existe
      await tx.planEntrenamiento.deleteMany({ where: { profileId: profile.id } })

      // Crear el nuevo plan con todos sus días y ejercicios
      return tx.planEntrenamiento.create({
        data: {
          profileId: profile.id,
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          dias: {
            create: dias.map((dia) => ({
              numero: dia.numero,
              nombre: dia.nombre?.trim() || null,
              ejercicios: {
                create: (dia.ejercicios ?? []).map((ej) => ({
                  ejercicioId: ej.ejercicioId,
                  series: ej.series ?? null,
                  repeticiones: ej.repeticiones?.trim() || null,
                  descanso: ej.descanso ?? null,
                  orden: ej.orden,
                })),
              },
            })),
          },
        },
        include: {
          dias: {
            orderBy: { numero: "asc" },
            include: {
              ejercicios: {
                orderBy: { orden: "asc" },
                include: { ejercicio: true },
              },
            },
          },
        },
      })
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    logger.error("POST plan-entrenamiento error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al guardar plan" }, { status: 500 })
  }
}
