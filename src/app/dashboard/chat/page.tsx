import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getPermisos } from "@/lib/permisos"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { ChatView } from "@/components/chat/ChatView"

type MensajeRow = {
  id: string
  contenido: string
  profileId: string
  createdAt: Date
  fullName: string | null
}

export default async function ChatPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/login")

  const permisos = await getPermisos(session.user.id)

  if (!permisos.verChat) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">💬</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Chat Comunitario</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          El chat comunitario está disponible para miembros con plan <strong>PRO</strong> o <strong>PREMIUM</strong>.<br />
          Conectate con otros miembros, compartí experiencias y recibí apoyo.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 text-left space-y-3">
          <p className="font-semibold text-gray-800 mb-4">¿Qué encontrarás en el chat?</p>
          {[
            "Comunidad de personas con objetivos similares",
            "Intercambio de tips y recetas",
            "Apoyo y motivación diaria",
            "Novedades de la comunidad",
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

  const mensajesRows = await prisma.$queryRaw<MensajeRow[]>(
    Prisma.sql`
      SELECT m.id, m.contenido, m."profileId", m."createdAt", p."fullName"
      FROM "ChatMessage" m
      JOIN "Profile" p ON p.id = m."profileId"
      ORDER BY m."createdAt" ASC
      LIMIT 50
    `
  )

  const mensajes = mensajesRows.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))

  return (
    <ChatView
      mensajesIniciales={mensajes}
      userId={session.user.id}
      profileId={profileId}
      isAdmin={session.user.role === "ADMIN"}
    />
  )
}
