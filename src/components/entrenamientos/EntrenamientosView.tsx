'use client'

import { useState, useEffect } from 'react'

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
  dias: Dia[]
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
    return null
  } catch {
    return null
  }
}

export function EntrenamientosView() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/entrenamiento-plan')
      .then((r) => r.json())
      .then((data: { plan: Plan | null }) => setPlan(data.plan ?? null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Entrenamientos</h1>
        <p className="text-sm text-gray-500 mt-1">Tu plan de entrenamiento personalizado</p>
      </div>

      {loading && (
        <div className="space-y-4 mt-6">
          {[1,2,3].map((i) => <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-24" />)}
        </div>
      )}

      {!loading && !plan && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center mt-6">
          <div className="text-5xl mb-4">🏋️</div>
          <p className="text-gray-700 font-medium">Tu nutricionista aún no asignó un plan</p>
          <p className="text-sm text-gray-500 mt-1">Podés consultarle por mensajes.</p>
        </div>
      )}

      {!loading && plan && (
        <div className="mt-6 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-emerald-800">{plan.nombre}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{plan.dias.length} día{plan.dias.length !== 1 ? 's' : ''} de entrenamiento</p>
          </div>

          {plan.dias.map((dia) => (
            <div key={dia.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Día {dia.numero}</span>
                {dia.nombre && <span className="text-sm font-semibold text-gray-800">— {dia.nombre}</span>}
              </div>

              {dia.ejercicios.length === 0 ? (
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-400">Sin ejercicios asignados</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {dia.ejercicios.map((ej) => (
                    <li key={ej.id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{ej.ejercicio.nombre}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {ej.series && (
                            <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2.5 py-0.5 font-medium">
                              {ej.series} series
                            </span>
                          )}
                          {ej.repeticiones && (
                            <span className="bg-emerald-100 text-emerald-700 text-xs rounded-full px-2.5 py-0.5 font-medium">
                              {ej.repeticiones} reps
                            </span>
                          )}
                          {ej.descanso && (
                            <span className="bg-blue-50 text-blue-600 text-xs rounded-full px-2.5 py-0.5 font-medium">
                              {ej.descanso}s desc.
                            </span>
                          )}
                        </div>
                      </div>
                      {ej.ejercicio.videoUrl && (
                        <button
                          onClick={() => setVideoUrl(ej.ejercicio.videoUrl)}
                          className="shrink-0 ml-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
                        >
                          ▶ Ver video
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal video YouTube */}
      {videoUrl && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setVideoUrl(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Video del ejercicio</p>
              <button onClick={() => setVideoUrl(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
