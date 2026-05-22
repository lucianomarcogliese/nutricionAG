'use client'

import { useState, useEffect } from 'react'

interface Ejercicio {
  id: string
  nombre: string
  descripcion: string | null
  videoUrl: string | null
  categoria: string
  creadoEn: string
}

const CATEGORIAS: { value: string; label: string }[] = [
  { value: 'PECHO',          label: 'Pecho' },
  { value: 'ESPALDA',        label: 'Espalda' },
  { value: 'PIERNAS',        label: 'Piernas' },
  { value: 'HOMBROS',        label: 'Hombros' },
  { value: 'BRAZOS',         label: 'Brazos' },
  { value: 'ABDOMEN',        label: 'Abdomen' },
  { value: 'CARDIO',         label: 'Cardio' },
  { value: 'CUERPO_COMPLETO', label: 'Cuerpo completo' },
]

const CATEGORIA_COLORS: Record<string, string> = {
  PECHO:          'bg-red-100 text-red-700',
  ESPALDA:        'bg-blue-100 text-blue-700',
  PIERNAS:        'bg-purple-100 text-purple-700',
  HOMBROS:        'bg-orange-100 text-orange-700',
  BRAZOS:         'bg-yellow-100 text-yellow-700',
  ABDOMEN:        'bg-green-100 text-green-700',
  CARDIO:         'bg-pink-100 text-pink-700',
  CUERPO_COMPLETO: 'bg-emerald-100 text-emerald-700',
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

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"

interface ModalState {
  open: boolean
  mode: 'create' | 'edit'
  id: string
  nombre: string
  categoria: string
  descripcion: string
  videoUrl: string
}

const EMPTY_MODAL: ModalState = {
  open: false, mode: 'create', id: '', nombre: '', categoria: 'PECHO', descripcion: '', videoUrl: '',
}

export function EjerciciosTab() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [modal, setModal] = useState<ModalState>(EMPTY_MODAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function fetchEjercicios(cat?: string) {
    setLoading(true)
    const url = cat ? `/api/admin/ejercicios?categoria=${cat}` : '/api/admin/ejercicios'
    fetch(url)
      .then((r) => r.json())
      .then((data: { ejercicios: Ejercicio[] }) => setEjercicios(data.ejercicios ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEjercicios() }, [])

  function handleFiltro(cat: string) {
    setFiltroCategoria(cat)
    fetchEjercicios(cat || undefined)
  }

  function openCreate() {
    setModal({ ...EMPTY_MODAL, open: true, mode: 'create' })
    setError('')
  }

  function openEdit(ej: Ejercicio) {
    setModal({
      open: true, mode: 'edit', id: ej.id,
      nombre: ej.nombre, categoria: ej.categoria,
      descripcion: ej.descripcion ?? '', videoUrl: ej.videoUrl ?? '',
    })
    setError('')
  }

  async function handleSave() {
    if (!modal.nombre.trim()) { setError('El nombre es requerido'); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        nombre: modal.nombre,
        categoria: modal.categoria,
        descripcion: modal.descripcion || undefined,
        videoUrl: modal.videoUrl || undefined,
      }
      const res = modal.mode === 'create'
        ? await fetch('/api/admin/ejercicios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch(`/api/admin/ejercicios/${modal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      const data = await res.json() as { ejercicio?: Ejercicio; error?: string }
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return }

      if (modal.mode === 'create' && data.ejercicio) {
        setEjercicios((prev) => [data.ejercicio!, ...prev])
      } else if (modal.mode === 'edit' && data.ejercicio) {
        setEjercicios((prev) => prev.map((e) => e.id === modal.id ? data.ejercicio! : e))
      }
      setModal(EMPTY_MODAL)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/ejercicios/${id}`, { method: 'DELETE' })
    setEjercicios((prev) => prev.filter((e) => e.id !== id))
  }

  const ytId = modal.videoUrl ? extractYouTubeId(modal.videoUrl) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ejercicios</h2>
          <p className="text-sm text-gray-500 mt-0.5">Catálogo global de ejercicios</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          + Nuevo ejercicio
        </button>
      </div>

      {/* Filtro */}
      <div className="mb-4">
        <select
          value={filtroCategoria}
          onChange={(e) => handleFiltro(e.target.value)}
          className={`${inputCls} max-w-xs`}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-12" />)}
        </div>
      ) : ejercicios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No hay ejercicios aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Categoría</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Video</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {ejercicios.map((ej) => (
                <tr key={ej.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{ej.nombre}</td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORIA_COLORS[ej.categoria] ?? 'bg-gray-100 text-gray-600'}`}>
                      {CATEGORIAS.find((c) => c.value === ej.categoria)?.label ?? ej.categoria}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {ej.videoUrl ? (
                      <span className="text-emerald-600 text-xs font-medium">✓ Sí</span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(ej)} className="text-blue-500 hover:text-blue-700 text-xs font-medium transition-colors">Editar</button>
                      <button onClick={() => handleDelete(ej.id)} className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear / editar */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">
                {modal.mode === 'create' ? 'Nuevo ejercicio' : 'Editar ejercicio'}
              </h3>
              <button onClick={() => setModal(EMPTY_MODAL)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={modal.nombre}
                  onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))}
                  placeholder="ej: Press de banca"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
                <select
                  value={modal.categoria}
                  onChange={(e) => setModal((m) => ({ ...m, categoria: e.target.value }))}
                  className={inputCls}
                >
                  {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción <span className="font-normal">(opcional)</span></label>
                <textarea
                  rows={2}
                  value={modal.descripcion}
                  onChange={(e) => setModal((m) => ({ ...m, descripcion: e.target.value }))}
                  placeholder="Descripción breve del ejercicio..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">URL de YouTube <span className="font-normal">(opcional)</span></label>
                <input
                  type="url"
                  value={modal.videoUrl}
                  onChange={(e) => setModal((m) => ({ ...m, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={inputCls}
                />
                {ytId && (
                  <div className="mt-2 rounded-lg overflow-hidden aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 justify-end">
              <button
                onClick={() => setModal(EMPTY_MODAL)}
                className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
