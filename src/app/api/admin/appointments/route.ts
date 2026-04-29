import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

const VALID_TIPOS = ["CONSULTA_NUTRICIONAL", "SEGUIMIENTO", "ANTROPOMETRIA", "CONSULTA_DEPORTIVA"]

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN" && session.user.role !== "RECEPCIONISTA") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")
    const nutricionistaId = searchParams.get("nutricionistaId")

    const where: {
      fecha?: { gte: Date; lte: Date }
      nutricionistaId?: string
    } = {}

    if (mes && anio) {
      const m = parseInt(mes, 10) - 1
      const a = parseInt(anio, 10)
      where.fecha = {
        gte: new Date(a, m, 1),
        lte: new Date(a, m + 1, 0, 23, 59, 59),
      }
    }

    if (nutricionistaId) {
      where.nutricionistaId = nutricionistaId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        nutricionista: { select: { id: true, nombre: true, color: true, matricula: true } },
      },
      orderBy: { fecha: "asc" },
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("GET /api/admin/appointments error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener turnos" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN" && session.user.role !== "RECEPCIONISTA") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, fecha, duracion, tipo, notas, nutricionistaId } = body

    if (!userId || !fecha || !tipo || !nutricionistaId) {
      return NextResponse.json(
        { error: "userId, fecha, tipo y nutricionistaId son requeridos" },
        { status: 400 }
      )
    }
    if (!VALID_TIPOS.includes(tipo)) {
      return NextResponse.json({ error: "Tipo de turno inválido" }, { status: 400 })
    }

    const [userExists, nutricionistaExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.nutritionist.findUnique({ where: { id: nutricionistaId }, select: { id: true, activo: true } }),
    ])

    if (!userExists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }
    if (!nutricionistaExists) {
      return NextResponse.json({ error: "Nutricionista no encontrado" }, { status: 404 })
    }
    if (!nutricionistaExists.activo) {
      return NextResponse.json({ error: "El nutricionista no está activo" }, { status: 400 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        nutricionistaId,
        fecha: new Date(fecha),
        duracion: duracion ?? 60,
        tipo,
        notas: notas ?? null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        nutricionista: { select: { id: true, nombre: true, color: true, matricula: true } },
      },
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/appointments error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el turno" }, { status: 500 })
  }
}
