'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Permisos {
  maxPlanes: number
  maxRutinas: number
  usarIA: boolean
  consultasProfesionales: boolean
}

interface PlanConfig {
  id: string
  nombre: string
  displayName: string
  precioARS: number
  permisos: Permisos
}

interface Subscription {
  plan: string
  estado: string
  fechaVencimiento: string | null
}

interface Props {
  planes: PlanConfig[]
  subscription: Subscription | null
  isLoggedIn: boolean
}

const PLAN_ICONS: Record<string, string> = {
  GRATIS: '🌱',
  PRO: '⚡',
  PREMIUM: '💎',
}

const PLAN_COLORS: Record<string, { badge: string; button: string; border: string; highlight: boolean }> = {
  GRATIS: {
    badge: 'bg-gray-100 text-gray-600',
    button: 'bg-gray-200 text-gray-500 cursor-default',
    border: 'border-gray-200',
    highlight: false,
  },
  PRO: {
    badge: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    border: 'border-emerald-400',
    highlight: true,
  },
  PREMIUM: {
    badge: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-500 hover:bg-amber-600 text-white',
    border: 'border-amber-400',
    highlight: false,
  },
}

const PLAN_ORDER: Record<string, number> = { GRATIS: 0, PRO: 1, PREMIUM: 2 }

function formatPrice(precio: number) {
  if (precio === 0) return 'Gratis'
  return `$${precio.toLocaleString('es-AR')}/mes`
}

function permisoLabel(key: keyof Permisos, value: number | boolean): string {
  if (key === 'maxPlanes') return value === -1 ? 'Planes ilimitados' : `${value} plan nutricional`
  if (key === 'maxRutinas') return value === -1 ? 'Rutinas ilimitadas' : `${value} rutina`
  if (key === 'usarIA') return value ? 'Asistente IA incluido' : 'Sin asistente IA'
  if (key === 'consultasProfesionales') return value ? 'Consultas con profesionales' : 'Sin consultas profesionales'
  return ''
}

export function PlanesClient({ planes, subscription, isLoggedIn }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const planActual = subscription?.estado === 'ACTIVA' ? subscription.plan : 'GRATIS'
  const planActualOrder = PLAN_ORDER[planActual] ?? 0

  async function handleSuscribir(planNombre: string) {
    if (!isLoggedIn) {
      window.location.href = '/auth/login'
      return
    }
    setLoading(planNombre)
    setError(null)
    try {
      const res = await fetch('/api/suscripcion/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planNombre }),
      })
      const data = await res.json() as { initPoint?: string; error?: string }
      if (!res.ok || !data.initPoint) {
        setError(data.error ?? 'Error al crear la preferencia de pago')
        return
      }
      window.location.href = data.initPoint
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-emerald-600 font-bold text-lg">Nutrición AG</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Volver al dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Elegí tu plan</h1>
          <p className="text-gray-500 mt-2">Accedé a todas las herramientas de Nutrición AG</p>
          {subscription?.fechaVencimiento && planActual !== 'GRATIS' && (
            <p className="text-xs text-gray-400 mt-2">
              Tu plan vence el {new Date(subscription.fechaVencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planes.map((plan) => {
            const colors = PLAN_COLORS[plan.nombre] ?? PLAN_COLORS.GRATIS
            const isCurrent = plan.nombre === planActual
            const isLower = (PLAN_ORDER[plan.nombre] ?? 0) <= planActualOrder && !isCurrent
            const isLoadingThis = loading === plan.nombre
            const permisos = plan.permisos as Permisos

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 shadow-sm p-6 flex flex-col ${isCurrent ? colors.border : 'border-gray-200'} ${colors.highlight ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
              >
                {colors.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Más elegido</span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>Tu plan actual</span>
                  </div>
                )}

                <div className="text-3xl mb-3">{PLAN_ICONS[plan.nombre]}</div>
                <h2 className="text-xl font-bold text-gray-900">{plan.displayName}</h2>
                <p className="text-2xl font-bold mt-2 mb-4 text-gray-900">{formatPrice(plan.precioARS)}</p>

                <ul className="space-y-2 flex-1 mb-6">
                  {(Object.entries(permisos) as [keyof Permisos, number | boolean][]).map(([key, val]) => {
                    const label = permisoLabel(key, val)
                    const activo = val !== false && val !== 0
                    return (
                      <li key={key} className={`flex items-center gap-2 text-sm ${activo ? 'text-gray-700' : 'text-gray-400'}`}>
                        <span className={`text-xs ${activo ? 'text-emerald-500' : 'text-gray-300'}`}>{activo ? '✓' : '✗'}</span>
                        {label}
                      </li>
                    )
                  })}
                </ul>

                {isCurrent ? (
                  <div className={`w-full py-2.5 rounded-xl text-sm font-medium text-center ${colors.badge}`}>
                    Plan actual
                  </div>
                ) : isLower ? (
                  <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center bg-gray-100 text-gray-400 cursor-not-allowed">
                    Plan inferior
                  </div>
                ) : plan.precioARS === 0 ? (
                  <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center bg-gray-100 text-gray-500">
                    Gratis
                  </div>
                ) : (
                  <button
                    onClick={() => handleSuscribir(plan.nombre)}
                    disabled={!!loading}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${colors.button}`}
                  >
                    {isLoadingThis ? 'Procesando...' : 'Suscribirte'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          El pago se procesa de forma segura a través de MercadoPago. Podés cancelar en cualquier momento.
        </p>
      </main>
    </div>
  )
}
