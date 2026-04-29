import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { ensurePlanSeed } from "@/lib/plan-seed"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await ensurePlanSeed()

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        subscription: {
          select: {
            id: true,
            plan: true,
            estado: true,
            mpPaymentId: true,
            fechaInicio: true,
            fechaVencimiento: true,
            updatedAt: true,
          },
        },
      },
    })

    const planNombre = profile?.subscription?.plan ?? "GRATIS"

    const planConfig = await prisma.planConfig.findUnique({
      where: { nombre: planNombre },
    })

    return NextResponse.json({
      subscription: profile?.subscription ?? null,
      planConfig,
    })
  } catch (error) {
    console.error("GET /api/suscripcion/estado error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener estado de suscripción" }, { status: 500 })
  }
}
