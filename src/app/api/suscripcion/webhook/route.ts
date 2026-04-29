import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { MercadoPagoConfig, Payment } from "mercadopago"

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})
const paymentClient = new Payment(mpClient)

// MercadoPago reintenta si no recibe 200 — siempre retornar 200
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type?: string
      action?: string
      data?: { id?: string | number }
    }

    console.log('Webhook recibido:', body)

    // Solo procesar notificaciones de pago
    if (body.type !== "payment" && body.action !== "payment.updated") {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    const payment = await paymentClient.get({ id: String(paymentId) })

    if (payment.status !== "approved") return NextResponse.json({ ok: true })

    const metadata = payment.metadata as { user_id?: string; plan_nombre?: string } | undefined
    // MP convierte camelCase a snake_case en metadata
    const userId = metadata?.user_id
    const planNombre = metadata?.plan_nombre

    if (!userId || !planNombre) {
      console.error("Webhook MP: metadata incompleta", metadata)
      return NextResponse.json({ ok: true })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!profile) {
      console.error("Webhook MP: perfil no encontrado para userId", userId)
      return NextResponse.json({ ok: true })
    }

    const fechaInicio = new Date()
    const fechaVencimiento = new Date(fechaInicio)
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)

    // Idempotente: upsert por profileId, evita duplicados si MP reintenta
    await prisma.subscription.upsert({
      where: { profileId: profile.id },
      update: {
        plan: planNombre,
        estado: "ACTIVA",
        mpPaymentId: String(paymentId),
        fechaInicio,
        fechaVencimiento,
      },
      create: {
        profileId: profile.id,
        plan: planNombre,
        estado: "ACTIVA",
        mpPaymentId: String(paymentId),
        fechaInicio,
        fechaVencimiento,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("POST /api/suscripcion/webhook error:", error instanceof Error ? error.message : error)
    // Igual retornamos 200 para que MP no reintente indefinidamente
    return NextResponse.json({ ok: true })
  }
}
