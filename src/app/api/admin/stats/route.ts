import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const now = new Date()
    const mesStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const mesEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const [
      totalUsuarios,
      usuariosConPerfil,
      turnosPendientes,
      turnosEsteMes,
      objetivosMasComunes,
      actividadMasComun,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count({ where: { onboardingCompleted: true } }),
      prisma.appointment.count({ where: { estado: "PENDIENTE" } }),
      prisma.appointment.count({
        where: { fecha: { gte: mesStart, lte: mesEnd } },
      }),
      prisma.profile.groupBy({
        by: ["goal"],
        where: { goal: { not: null } },
        _count: { goal: true },
        orderBy: { _count: { goal: "desc" } },
      }),
      prisma.profile.groupBy({
        by: ["activityLevel"],
        where: { activityLevel: { not: null } },
        _count: { activityLevel: true },
        orderBy: { _count: { activityLevel: "desc" } },
      }),
    ])

    return NextResponse.json({
      totalUsuarios,
      usuariosConPerfil,
      turnosPendientes,
      turnosEsteMes,
      objetivosMasComunes: objetivosMasComunes.map((g) => ({
        goal: g.goal,
        count: g._count.goal,
      })),
      actividadMasComun: actividadMasComun.map((g) => ({
        activityLevel: g.activityLevel,
        count: g._count.activityLevel,
      })),
    })
  } catch (error) {
    console.error("GET /api/admin/stats error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
  }
}
