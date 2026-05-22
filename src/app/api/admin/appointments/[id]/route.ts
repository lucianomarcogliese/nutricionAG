import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import type { AppointmentStatus } from "@/generated/prisma/client"
import { sendEmail } from "@/lib/email"
import { cancelacionTurnoHtml, cancelacionTurnoSubject } from "@/emails/cancelacionTurno"

function formatFecha(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}
function formatHora(date: Date): string {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
}

const VALID_ESTADOS = ["PENDIENTE", "CONFIRMADO", "CANCELADO", "COMPLETADO"]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN" && session.user.role !== "RECEPCIONISTA") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    const data: { estado?: AppointmentStatus; notas?: string } = {}
    if (body.estado !== undefined) {
      if (!VALID_ESTADOS.includes(body.estado)) {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
      }
      data.estado = body.estado as AppointmentStatus
    }
    if (body.notas !== undefined) {
      data.notas = body.notas
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        nutricionista: { select: { id: true, nombre: true, color: true, matricula: true } },
      },
    })

    if (data.estado === "CANCELADO" && appointment.user.email) {
      try {
        await sendEmail(
          appointment.user.email,
          cancelacionTurnoSubject,
          cancelacionTurnoHtml({
            nombre: appointment.user.name ?? "Usuario",
            fecha: formatFecha(appointment.fecha),
            hora: formatHora(appointment.fecha),
            nutricionista: appointment.nutricionista?.nombre ?? "",
          })
        )
      } catch (emailError) {
        console.error("PATCH /api/admin/appointments/[id]: error enviando email de cancelación:", emailError instanceof Error ? emailError.message : emailError)
      }
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error("PATCH /api/admin/appointments/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar el turno" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN" && session.user.role !== "RECEPCIONISTA") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    await prisma.appointment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/appointments/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar el turno" }, { status: 500 })
  }
}
