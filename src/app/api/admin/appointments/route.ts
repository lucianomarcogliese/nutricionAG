import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { appointmentSchema } from "@/lib/schemas/appointmentSchema"
import { sendEmail } from "@/lib/email"
import { confirmacionTurnoHtml, confirmacionTurnoSubject } from "@/emails/confirmacionTurno"

function formatFecha(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}
function formatHora(date: Date): string {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
}
const TIPO_LABELS: Record<string, string> = {
  CONSULTA_NUTRICIONAL: "Consulta nutricional",
  SEGUIMIENTO: "Seguimiento",
  ANTROPOMETRIA: "Antropometría",
  CONSULTA_DEPORTIVA: "Consulta deportiva",
}

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
    const result = appointmentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { userId, nutricionistaId, fecha, tipo, duracion, notas } = result.data

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
        duracion,
        tipo,
        notas: notas ?? null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        nutricionista: { select: { id: true, nombre: true, color: true, matricula: true } },
      },
    })

    try {
      if (appointment.user.email) {
        await sendEmail(
          appointment.user.email,
          confirmacionTurnoSubject,
          confirmacionTurnoHtml({
            nombre: appointment.user.name ?? "Usuario",
            fecha: formatFecha(appointment.fecha),
            hora: formatHora(appointment.fecha),
            nutricionista: appointment.nutricionista?.nombre ?? "",
            tipo: TIPO_LABELS[appointment.tipo] ?? appointment.tipo,
          })
        )
      }
    } catch (emailError) {
      console.error("POST /api/admin/appointments: error enviando email:", emailError instanceof Error ? emailError.message : emailError)
    }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/appointments error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el turno" }, { status: 500 })
  }
}
