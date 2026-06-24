import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { logger } from "@/lib/logger"

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})
const preferenceClient = new Preference(mpClient)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { planNombre } = body as { planNombre: string }

    if (!planNombre) {
      return NextResponse.json({ error: "planNombre es requerido" }, { status: 400 })
    }

    const planConfig = await prisma.planConfig.findUnique({
      where: { nombre: planNombre },
    })

    if (!planConfig || !planConfig.activo) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    if (planConfig.precioARS === 0) {
      return NextResponse.json({ error: "El plan gratuito no requiere pago" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: planNombre,
            title: `Nutrición AG — ${planConfig.displayName}`,
            quantity: 1,
            unit_price: planConfig.precioARS,
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: `${baseUrl}/suscripcion/exito`,
          failure: `${baseUrl}/suscripcion/error`,
          pending: `${baseUrl}/suscripcion/pendiente`,
        },
        // auto_return requiere URLs públicas — no funciona en localhost
        ...(baseUrl.startsWith("https") ? { auto_return: "approved" as const } : {}),
        metadata: {
          userId: session.user.id,
          planNombre,
        },
        notification_url: `${baseUrl}/api/suscripcion/webhook`,
      },
    })

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
    })
  } catch (error) {
    logger.error('MP Error completo:', JSON.stringify(error, null, 2))
    logger.error('MP Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Error al crear preferencia de pago', detail: String(error) }, { status: 500 })
  }
}
