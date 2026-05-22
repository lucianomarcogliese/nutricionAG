'use client'

import { useState, useEffect } from 'react'

interface EjercicioCatalogo {
  id: string
  nombre: string
  descripcion: string | null
  videoUrl: string | null
  categoria: string
}

interface EjercicioDiaLocal {
  _key: string
  ejercicioId: string
  nombre: string
  series: string
  repeticiones: string
  descanso: string
}

interface DiaLocal {
  numero: number
  nombre: string
  ejercicios: EjercicioDiaLocal[]
}

const CATEGORIAS: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'PECHO', label: 'Pecho' },
  { value: 'ESPALDA', label: 'Espalda' },
  { value: 'PIERNAS', label: 'Piernas' },
  { value: 'HOMBROS', label: 'Hombros' },
  { value: 'BRAZOS', label: 'Brazos' },
  { value: 'ABDOMEN', label: 'Abdomen' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'CUERPO_COMPLETO', label: 'Cuerpo completo' },
]

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"

function generateDias(n: number): DiaLocal[] {
  return Array.from({ length: n }, (_, i) => ({ numero: i + 1, nombre: '', ejercicios: [] }))
}

interface MiniModalState {
  open: boolean
  ejercicioId: string
  nombre: string
  series: string
  repeticiones: string
  descanso: string
}

const EMPTY_MINI: MiniModalState = { open: false, ejercicioId: '', nombre: '', series: '', repeticiones: '', descanso: '' }

interface Props {
  userId: string
  onClose: () => void
  onSaved: () => void
}

export function EntrenamientoPlanBuilder({ userId, onClose, onSaved }: Props) {
  const [planNombre, setPlanNombre] = useState('')
  const [cantDias, setCantDias] = useState(3)
  const [dias, setDias] = useState<DiaLocal[]>(() => generateDias(3))
  const [activeDia, setActiveDia] = useState(1)

  const [ejerciciosCatalogo, setEjerciciosCatalogo] = useState<EjercicioCatalogo[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [loadingCatalogo, setLoadingCatalogo] = useState(true)

  const [miniModal, setMiniModal] = useState<MiniModalState>(EMPTY_MINI)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/ejercicios')
      .then((r) => r.json())
      .then((data: { ejercicios: EjercicioCatalogo[] }) => setEjerciciosCatalogo(data.ejercicios ?? []))
      .finally(() => setLoadingCatalogo(false))
  }, [])

  function handleCantDias(n: number) {
    setCantDias(n)
    setDias((prev) => {
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, (_, i) => ({ numero: prev.length + i + 1, nombre: '', ejercicios: [] }))]
      }
      return prev.slice(0, n)
    })
    if (activeDia > n) setActiveDia(n)
  }

  function updateDiaNombre(numero: number, nombre: string) {
    setDias((prev) => prev.map((d) => d.numero === numero ? { ...d, nombre } : d))
  }

  function openMiniModal(ej: EjercicioCatalogo) {
    setMiniModal({ open: true, ejercicioId: ej.id, nombre: ej.nombre, series: '', repeticiones: '', descanso: '' })
  }

  function confirmAddEjercicio() {
    const key = `${miniModal.ejercicioId}-${Date.now()}`
    const newEj: EjercicioDiaLocal = {
      _key: key,
      ejercicioId: miniModal.ejercicioId,
      nombre: miniModal.nombre,
      series: miniModal.series,
      repeticiones: miniModal.repeticiones,
      descanso: miniModal.descanso,
    }
    setDias((prev) => prev.map((d) =>
      d.numero === activeDia ? { ...d, ejercicios: [...d.ejercicios, newEj] } : d
    ))
    setMiniModal(EMPTY_MINI)
  }

  function removeEjercicio(diaNumero: number, key: string) {
    setDias((prev) => prev.map((d) =>
      d.numero === diaNumero ? { ...d, ejercicios: d.ejercicios.filter((e) => e._key !== key) } : d
    ))
  }

  function moveEjercicio(diaNumero: number, key: string, dir: 'up' | 'down') {
    setDias((prev) => prev.map((d) => {
      if (d.numero !== diaNumero) return d
      const idx = d.ejercicios.findIndex((e) => e._key === key)
      if (idx < 0) return d
      const newEjs = [...d.ejercicios]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= newEjs.length) return d
      ;[newEjs[idx], newEjs[target]] = [newEjs[target], newEjs[idx]]
      return { ...d, ejercicios: newEjs }
    }))
  }

  async function handleSave() {
    if (!planNombre.trim()) { setError('El nombre del plan es requerido'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        nombre: planNombre.trim(),
        dias: dias.map((d) => ({
          numero: d.numero,
          nombre: d.nombre.trim() || undefined,
          ejercicios: d.ejercicios.map((e, i) => ({
            ejercicioId: e.ejercicioId,
            series: e.series ? parseInt(e.series) : undefined,
            repeticiones: e.repeticiones.trim() || undefined,
            descanso: e.descanso ? parseInt(e.descanso) : undefined,
            orden: i,
          })),
        })),
      }
      const res = await fetch(`/api/admin/usuarios/${userId}/plan-entrenamiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Error al guardar')
        return
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const filteredEjercicios = filtroCategoria
    ? ejerciciosCatalogo.filter((e) => e.categoria === filtroCategoria)
    : ejerciciosCatalogo

  const activeDiaData = dias.find((d) => d.numero === activeDia)

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-stretch justify-center overflow-hidden">
      <div className="bg-white w-full max-w-5xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="font-semibold text-gray-900 text-lg">Armar plan de entrenamiento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Nombre del plan</label>
            <input
              type="text"
              value={planNombre}
              onChange={(e) => setPlanNombre(e.target.value)}
              placeholder="ej: Plan fuerza 3 días"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none w-56"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Días</label>
            <select
              value={cantDias}
              onChange={(e) => handleCantDias(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              {[1,2,3,4,5,6,7].map((n) => <option key={n} value={n}>{n} día{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>

        {/* Body split */}
        <div className="flex flex-1 min-h-0">
          {/* Left: días */}
          <div className="flex-[3] overflow-y-auto px-6 py-4 space-y-4 border-r border-gray-100">
            {dias.map((dia) => (
              <div
                key={dia.numero}
                className={`rounded-xl border-2 transition-colors ${activeDia === dia.numero ? 'border-emerald-400' : 'border-gray-200'}`}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setActiveDia(dia.numero)}
                >
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeDia === dia.numero ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    Día {dia.numero}
                  </span>
                  <input
                    type="text"
                    value={dia.nombre}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateDiaNombre(dia.numero, e.target.value)}
                    placeholder="Nombre del día (opcional)"
                    className="flex-1 text-sm border-0 outline-none bg-transparent placeholder-gray-400 font-medium"
                  />
                  <span className="text-xs text-gray-400">{dia.ejercicios.length} ejerc.</span>
                </div>

                {activeDia === dia.numero && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                    {dia.ejercicios.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">
                        Seleccioná ejercicios del panel derecho →
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {dia.ejercicios.map((ej, idx) => (
                          <li key={ej._key} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-800 truncate block">{ej.nombre}</span>
                              <span className="text-xs text-gray-500">
                                {ej.series && `${ej.series} series`}
                                {ej.series && ej.repeticiones && ' × '}
                                {ej.repeticiones}
                                {ej.descanso && ` · ${ej.descanso}s desc.`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => moveEjercicio(dia.numero, ej._key, 'up')}
                                disabled={idx === 0}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1"
                              >↑</button>
                              <button
                                onClick={() => moveEjercicio(dia.numero, ej._key, 'down')}
                                disabled={idx === dia.ejercicios.length - 1}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1"
                              >↓</button>
                              <button
                                onClick={() => removeEjercicio(dia.numero, ej._key)}
                                className="text-red-400 hover:text-red-600 text-sm leading-none ml-1"
                              >×</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: biblioteca */}
          <div className="flex-[2] flex flex-col min-h-0 border-l border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Biblioteca — Día {activeDia}
              </p>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none bg-white w-full"
              >
                {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              {loadingCatalogo ? (
                <div className="space-y-2">
                  {[1,2,3].map((i) => <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-10" />)}
                </div>
              ) : filteredEjercicios.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Sin ejercicios en esta categoría</p>
              ) : (
                filteredEjercicios.map((ej) => (
                  <div key={ej.id} className="flex items-center gap-2 bg-gray-50 hover:bg-emerald-50 rounded-lg px-3 py-2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ej.nombre}</p>
                    </div>
                    <button
                      onClick={() => openMiniModal(ej)}
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors"
                      title="Agregar al día"
                    >+</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 shrink-0">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-5 py-2 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-6 py-2 text-sm font-medium transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar plan'}
            </button>
          </div>
        </div>
      </div>

      {/* Mini-modal para ingresar series/reps/descanso */}
      {miniModal.open && (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Agregar ejercicio</p>
                <p className="text-xs text-gray-500 mt-0.5">{miniModal.nombre}</p>
              </div>
              <button onClick={() => setMiniModal(EMPTY_MINI)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Series</label>
                  <input
                    type="number" min="1"
                    value={miniModal.series}
                    onChange={(e) => setMiniModal((m) => ({ ...m, series: e.target.value }))}
                    placeholder="ej: 4"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Repeticiones</label>
                  <input
                    type="text"
                    value={miniModal.repeticiones}
                    onChange={(e) => setMiniModal((m) => ({ ...m, repeticiones: e.target.value }))}
                    placeholder="ej: 10-12"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Descanso (seg) <span className="font-normal">— opcional</span></label>
                <input
                  type="number" min="0"
                  value={miniModal.descanso}
                  onChange={(e) => setMiniModal((m) => ({ ...m, descanso: e.target.value }))}
                  placeholder="ej: 90"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 justify-end">
              <button
                onClick={() => setMiniModal(EMPTY_MINI)}
                className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium"
              >Cancelar</button>
              <button
                onClick={confirmAddEjercicio}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
              >Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
