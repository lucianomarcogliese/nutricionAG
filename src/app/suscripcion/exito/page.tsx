'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SuscripcionEstado {
  subscription: { plan: string; fechaVencimiento: string | null } | null
  planConfig: { displayName: string } | null
}

export default function SuscripcionExitoPage() {
  const [estado, setEstado] = useState<SuscripcionEstado | null>(null)

  useEffect(() => {
    fetch('/api/suscripcion/estado')
      .then((r) => r.json())
      .then((d: SuscripcionEstado) => setEstado(d))
      .catch(() => null)
  }, [])

  const planName = estado?.planConfig?.displayName ?? 'nuevo plan'
  const vence = estado?.subscription?.fechaVencimiento
    ? new Date(estado.subscription.fechaVencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mx-auto mb-4">
          ✅
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Suscripción activada!
        </h1>
        <p className="text-gray-500 mb-1">
          Tu {planName} está activo.
        </p>
        {vence && (
          <p className="text-xs text-gray-400 mb-6">Vence el {vence}</p>
        )}
        {!vence && <div className="mb-6" />}
        <Link
          href="/dashboard"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-8 py-3 transition-colors"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
