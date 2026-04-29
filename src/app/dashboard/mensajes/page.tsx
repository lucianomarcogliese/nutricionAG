import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getPermisos } from "@/lib/permisos"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { MensajesView } from "@/components/mensajes/MensajesView"

export default async function MensajesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/login")

  const permisos = await getPermisos(session.user.id)

  if (!permisos.verMensajesPrivados) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">✉️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Mensajes Privados</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Los mensajes privados con tu nutricionista están disponibles para miembros con plan{" "}
          <strong>PRO</strong> o <strong>PREMIUM</strong>.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 text-left space-y-3">
          <p className="font-semibold text-gray-800 mb-4">¿Qué incluye el chat privado?</p>
          {[
            "Comunicación directa con tu nutricionista",
            "Seguimiento personalizado entre consultas",
            "Respuestas a dudas sobre tu plan",
            "Historial completo de la conversación",
          ].map((b) => (
            <div key={b} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-emerald-500 mt-0.5">✓</span>
              {b}
            </div>
          ))}
        </div>
        <a
          href="/planes"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Ver planes y precios →
        </a>
      </div>
    )
  }

  const profileRows = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT id FROM "Profile" WHERE "userId" = ${session.user.id} LIMIT 1`
  )
  const profileId = profileRows[0]?.id ?? ""

  return <MensajesView profileId={profileId} userId={session.user.id} />
}
