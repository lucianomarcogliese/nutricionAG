import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

import { getPermisos } from "@/lib/permisos"
import { RecetasView } from "@/components/recetas/RecetasView"

export default async function RecetasPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/login")

  const permisos = await getPermisos(session.user.id)

  if (!permisos.verRecetas) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">🍳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Recetas</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Las recetas están disponibles para miembros con plan <strong>PRO</strong> o <strong>PREMIUM</strong>.<br />
          Descubrí preparaciones saludables pensadas por nuestros nutricionistas.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 text-left space-y-3">
          <p className="font-semibold text-gray-800 mb-4">¿Qué encontrarás en Recetas?</p>
          {[
            "Preparaciones saludables con valores nutricionales",
            "Filtros por objetivo, tipo de comida e ingredientes",
            "Recetas creadas por nutricionistas especializados",
            "Ideas para cada momento del día",
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

  return <RecetasView />
}
