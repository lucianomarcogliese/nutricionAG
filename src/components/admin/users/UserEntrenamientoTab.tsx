'use client'

import { useState, useEffect } from 'react'
import { EntrenamientoPlanBuilder } from '../EntrenamientoPlanBuilder'

interface EjercicioInfo {
  id: string
  nombre: string
  videoUrl: string | null
}

interface EjercicioDia {
  id: string
  series: number | null
  repeticiones: string | null
  descanso: number | null
  orden: number
  ejercicio: EjercicioInfo
}

interface Dia {
  id: string
  numero: number
  nombre: string | null
  ejercicios: EjercicioDia[]
}

interface Plan {
  id: string
  nombre: string
  creadoEn: string
  dias: Dia[]
}

interface Props {
  userId: string
}

export function UserEntrenamientoTab({ userId }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)

  function fetchPlan() {
    setLoading(true)
    fetch(`/api/admin/usuarios/${userId}/plan-entrenamiento`)
      .then((r) => r.json())
      .then((data: { plan: Plan | null }) => setPlan(data.plan ?? null))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPlan() }, [userId])

  function handleSaved() {
    setShowBuilder(false)
    fetchPlan()
  }

  return (
    <div className="px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Plan de entrenamiento</p>
        <button
          onClick={() => setShowBuilder(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
        >
          {plan ? 'Editar plan' : 'Crear plan'}
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2].map((i) => <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-12" />)}
        </div>
      )}

      {!loading && !plan && (
        <div className="text-center py-8 text-sm text-gray-400">Sin plan asignado aún</div>
      )}

      {!loading && plan && (
        <div className="space-y-3">
          <div className="bg-emerald-50 rounded-xl px-4 py-2.5">
            <p className="text-sm font-semibold text-emerald-800">{plan.nombre}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{plan.dias.length} día{plan.dias.length !== 1 ? 's' : ''}</p>
          </div>

          {plan.dias.map((dia) => (
            <div key={dia.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500">Día {dia.numero}</span>
                {dia.nombre && <span className="text-xs font-medium text-gray-700">— {dia.nombre}</span>}
                <span className="ml-auto text-xs text-gray-400">{dia.ejercicios.length} ejerc.</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {dia.ejercicios.length === 0 ? (
                  <li className="px-4 py-2 text-xs text-gray-400">Sin ejercicios</li>
                ) : (
                  dia.ejercicios.map((ej) => (
                    <li key={ej.id} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{ej.ejercicio.nombre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {ej.series && `${ej.series} series`}
                          {ej.series && ej.repeticiones && ' × '}
                          {ej.repeticiones}
                          {ej.descanso && ` · ${ej.descanso}s desc.`}
                        </p>
                      </div>
                      {ej.ejercicio.videoUrl && (
                        <span className="text-xs text-emerald-600 shrink-0">▶ video</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {showBuilder && (
        <EntrenamientoPlanBuilder
          userId={userId}
          onClose={() => setShowBuilder(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
