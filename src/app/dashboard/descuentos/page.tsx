import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getPermisos } from "@/lib/permisos"
import { DescuentosView } from "@/components/descuentos/DescuentosView"

export default async function DescuentosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const permisos = await getPermisos(session.user.id)

  if (!permisos.verDescuentos) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">🏷️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Descuentos Exclusivos</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Los descuentos exclusivos son un beneficio para miembros con plan <strong>PRO</strong> o <strong>PREMIUM</strong>.<br />
          Accedé a ofertas especiales en productos y servicios de nutrición y bienestar.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 text-left space-y-3">
          <p className="font-semibold text-gray-800 mb-4">¿Qué incluyen los descuentos?</p>
          {[
            "Códigos de descuento en suplementos y alimentos saludables",
            "Ofertas en equipamiento deportivo y cocina",
            "Beneficios en servicios de bienestar y salud",
            "Acceso anticipado a nuevas ofertas",
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

  return <DescuentosView />
}
