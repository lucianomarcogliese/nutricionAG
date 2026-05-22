'use client'

import { useEffect, useState } from 'react'

type ObjetivoPlan = 'DEFICIT_CALORICO' | 'GANANCIA_MUSCULAR' | 'MANTENIMIENTO' | 'VEGETARIANO' | 'SIN_TACC' | 'PERSONALIZADO'

const OBJETIVO_LABELS: Record<ObjetivoPlan, string> = {
  DEFICIT_CALORICO: 'Déficit calórico',
  GANANCIA_MUSCULAR: 'Ganancia muscular',
  MANTENIMIENTO: 'Mantenimiento',
  VEGETARIANO: 'Vegetariano',
  SIN_TACC: 'Sin TACC',
  PERSONALIZADO: 'Personalizado',
}

const OBJETIVO_COLORS: Record<ObjetivoPlan, string> = {
  DEFICIT_CALORICO: 'bg-red-100 text-red-700',
  GANANCIA_MUSCULAR: 'bg-green-100 text-green-700',
  MANTENIMIENTO: 'bg-blue-100 text-blue-700',
  VEGETARIANO: 'bg-emerald-100 text-emerald-700',
  SIN_TACC: 'bg-amber-100 text-amber-700',
  PERSONALIZADO: 'bg-gray-100 text-gray-600',
}

interface TemplateOpcion {
  id: string
  texto: string
  orden: number
}

interface TemplateGrupo {
  id: string
  nombre: string
  orden: number
  opciones: TemplateOpcion[]
}

interface TemplateComida {
  id: string
  nombre: string
  orden: number
  nota: string | null
  ideasMenu: string | null
  grupos: TemplateGrupo[]
}

interface TemplateSummary {
  id: string
  nombre: string
  descripcion: string | null
  objetivo: ObjetivoPlan
  creadoEn: string
  _count: { comidas: number }
  pacientesCount: number
}

interface TemplateFull extends TemplateSummary {
  recomendaciones: string | null
  suplementos: string | null
  comidas: TemplateComida[]
}

const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm'
const textareaCls = 'border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none'

function defaultComidas(): TemplateComida[] {
  const grupos = ['Hidratos', 'Proteínas', 'Frutas/Vegetales', 'Grasas']
  return [
    { id: '', nombre: 'Desayuno / Merienda', orden: 1, nota: null, ideasMenu: null, grupos: grupos.map((n, i) => ({ id: '', nombre: n, orden: i + 1, opciones: [] })) },
    { id: '', nombre: 'Colación media mañana', orden: 2, nota: null, ideasMenu: null, grupos: [{ id: '', nombre: 'Opciones', orden: 1, opciones: [] }] },
    { id: '', nombre: 'Almuerzo', orden: 3, nota: null, ideasMenu: null, grupos: grupos.map((n, i) => ({ id: '', nombre: n, orden: i + 1, opciones: [] })) },
    { id: '', nombre: 'Colación media tarde', orden: 4, nota: null, ideasMenu: null, grupos: [{ id: '', nombre: 'Opciones', orden: 1, opciones: [] }] },
    { id: '', nombre: 'Cena', orden: 5, nota: null, ideasMenu: null, grupos: grupos.map((n, i) => ({ id: '', nombre: n, orden: i + 1, opciones: [] })) },
  ]
}

export function TemplatesNutricionalesTab() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<TemplateFull | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newObjetivo, setNewObjetivo] = useState<ObjetivoPlan>('DEFICIT_CALORICO')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedComidas, setExpandedComidas] = useState<Record<number, boolean>>({})

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/templates-nutricionales')
      const data = await res.json() as { templates: TemplateSummary[] }
      setTemplates(data.templates ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTemplate() {
    if (!newNombre.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/admin/templates-nutricionales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newNombre.trim(), objetivo: newObjetivo }),
      })
      const data = await res.json() as { template: TemplateSummary; error?: string }
      if (!res.ok) {
        setCreateError(data.error ?? `Error ${res.status} al crear template`)
        return
      }
      if (data.template) {
        await openEditor(data.template.id)
        setShowNewModal(false)
        setNewNombre('')
        setNewObjetivo('DEFICIT_CALORICO')
        setCreateError('')
        await loadTemplates()
      }
    } catch {
      setCreateError('Error de conexión al crear template')
    } finally {
      setCreating(false)
    }
  }

  async function openEditor(id: string) {
    const res = await fetch(`/api/admin/templates-nutricionales/${id}`)
    const data = await res.json() as { template: TemplateFull }
    if (res.ok && data.template) {
      const t = data.template
      // Si no tiene comidas, inicializar con las 5 por defecto
      if (t.comidas.length === 0) {
        t.comidas = defaultComidas()
      }
      setEditingTemplate(t)
      setExpandedComidas({ 0: true })
    }
  }

  async function handleSaveTemplate() {
    if (!editingTemplate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/templates-nutricionales/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editingTemplate.nombre,
          objetivo: editingTemplate.objetivo,
          descripcion: editingTemplate.descripcion,
          recomendaciones: editingTemplate.recomendaciones,
          suplementos: editingTemplate.suplementos,
          comidas: editingTemplate.comidas,
        }),
      })
      if (res.ok) {
        setEditingTemplate(null)
        await loadTemplates()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este template? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/templates-nutricionales/${id}`, { method: 'DELETE' })
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  // Helpers para editar el template en memoria
  function updateTemplateField<K extends keyof TemplateFull>(field: K, value: TemplateFull[K]) {
    setEditingTemplate((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  function updateComida(comidaIdx: number, field: keyof TemplateComida, value: string | null) {
    setEditingTemplate((prev) => {
      if (!prev) return prev
      const comidas = prev.comidas.map((c, i) => i === comidaIdx ? { ...c, [field]: value } : c)
      return { ...prev, comidas }
    })
  }

  function addOpcion(comidaIdx: number, grupoIdx: number, texto: string) {
    if (!texto.trim()) return
    setEditingTemplate((prev) => {
      if (!prev) return prev
      const comidas = prev.comidas.map((c, ci) => {
        if (ci !== comidaIdx) return c
        const grupos = c.grupos.map((g, gi) => {
          if (gi !== grupoIdx) return g
          const orden = (g.opciones[g.opciones.length - 1]?.orden ?? 0) + 1
          return { ...g, opciones: [...g.opciones, { id: '', texto: texto.trim(), orden }] }
        })
        return { ...c, grupos }
      })
      return { ...prev, comidas }
    })
  }

  function removeOpcion(comidaIdx: number, grupoIdx: number, opcionIdx: number) {
    setEditingTemplate((prev) => {
      if (!prev) return prev
      const comidas = prev.comidas.map((c, ci) => {
        if (ci !== comidaIdx) return c
        const grupos = c.grupos.map((g, gi) => {
          if (gi !== grupoIdx) return g
          return { ...g, opciones: g.opciones.filter((_, oi) => oi !== opcionIdx) }
        })
        return { ...c, grupos }
      })
      return { ...prev, comidas }
    })
  }

  function updateOpcionTexto(comidaIdx: number, grupoIdx: number, opcionIdx: number, texto: string) {
    setEditingTemplate((prev) => {
      if (!prev) return prev
      const comidas = prev.comidas.map((c, ci) => {
        if (ci !== comidaIdx) return c
        const grupos = c.grupos.map((g, gi) => {
          if (gi !== grupoIdx) return g
          const opciones = g.opciones.map((o, oi) => oi === opcionIdx ? { ...o, texto } : o)
          return { ...g, opciones }
        })
        return { ...c, grupos }
      })
      return { ...prev, comidas }
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-16" />)}
      </div>
    )
  }

  // Editor modal
  if (editingTemplate) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Editar template</h2>
            <div className="flex gap-2">
              <button onClick={() => setEditingTemplate(null)} className="border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveTemplate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                {saving ? 'Guardando...' : 'Guardar template'}
              </button>
            </div>
          </div>

          {/* Campos básicos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input type="text" value={editingTemplate.nombre} onChange={(e) => updateTemplateField('nombre', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo</label>
                <select value={editingTemplate.objetivo} onChange={(e) => updateTemplateField('objetivo', e.target.value as ObjetivoPlan)} className={inputCls}>
                  {(Object.keys(OBJETIVO_LABELS) as ObjetivoPlan[]).map((k) => (
                    <option key={k} value={k}>{OBJETIVO_LABELS[k]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <textarea rows={2} value={editingTemplate.descripcion ?? ''} onChange={(e) => updateTemplateField('descripcion', e.target.value || null)} className={textareaCls} placeholder="Descripción breve del template..." />
            </div>
          </div>

          {/* Comidas */}
          <div className="space-y-3 mb-4">
            {editingTemplate.comidas.map((comida, ci) => (
              <div key={ci} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedComidas((prev) => ({ ...prev, [ci]: !prev[ci] }))}
                >
                  <span className="font-semibold text-gray-800">{comida.nombre}</span>
                  <span className="text-gray-400 text-lg">{expandedComidas[ci] ? '▲' : '▼'}</span>
                </button>

                {expandedComidas[ci] && (
                  <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nota de la comida</label>
                      <input type="text" value={comida.nota ?? ''} onChange={(e) => updateComida(ci, 'nota', e.target.value || null)} className={inputCls} placeholder="Ej: HIDRATACIÓN CON AGUA" />
                    </div>

                    {comida.grupos.map((grupo, gi) => (
                      <GrupoEditor
                        key={gi}
                        grupo={grupo}
                        onAddOpcion={(texto) => addOpcion(ci, gi, texto)}
                        onRemoveOpcion={(oi) => removeOpcion(ci, gi, oi)}
                        onUpdateOpcion={(oi, texto) => updateOpcionTexto(ci, gi, oi, texto)}
                      />
                    ))}

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Ideas de menú</label>
                      <textarea rows={3} value={comida.ideasMenu ?? ''} onChange={(e) => updateComida(ci, 'ideasMenu', e.target.value || null)} className={textareaCls} placeholder="Ideas de preparación para esta comida..." />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recomendaciones y suplementos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Recomendaciones generales</label>
              <textarea rows={5} value={editingTemplate.recomendaciones ?? ''} onChange={(e) => updateTemplateField('recomendaciones', e.target.value || null)} className={textareaCls} placeholder="Recomendaciones nutricionales para este plan..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Suplementos</label>
              <textarea rows={3} value={editingTemplate.suplementos ?? ''} onChange={(e) => updateTemplateField('suplementos', e.target.value || null)} className={textareaCls} placeholder="Suplementación recomendada (opcional)..." />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Lista principal
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">Templates nutricionales</h2>
        <button onClick={() => setShowNewModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          + Nuevo template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          No hay templates todavía.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Objetivo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Descripción</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Pacientes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{t.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${OBJETIVO_COLORS[t.objetivo]}`}>
                      {OBJETIVO_LABELS[t.objetivo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-xs truncate">{t.descripcion ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{t.pacientesCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEditor(t.id)} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">Editar</button>
                      <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-40">
                        {deletingId === t.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nuevo template */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Nuevo template</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input type="text" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} className={inputCls} placeholder="Ej: Déficit calórico estándar" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo</label>
              <select value={newObjetivo} onChange={(e) => setNewObjetivo(e.target.value as ObjetivoPlan)} className={inputCls}>
                {(Object.keys(OBJETIVO_LABELS) as ObjetivoPlan[]).map((k) => (
                  <option key={k} value={k}>{OBJETIVO_LABELS[k]}</option>
                ))}
              </select>
            </div>
            {createError && <p className="text-red-600 text-xs">{createError}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => { setShowNewModal(false); setNewNombre(''); setCreateError('') }} className="border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCreateTemplate} disabled={!newNombre.trim() || creating} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                {creating ? 'Creando...' : 'Crear y editar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-componente para editar un grupo con sus opciones
interface GrupoEditorProps {
  grupo: TemplateGrupo
  onAddOpcion: (texto: string) => void
  onRemoveOpcion: (opcionIdx: number) => void
  onUpdateOpcion: (opcionIdx: number, texto: string) => void
}

function GrupoEditor({ grupo, onAddOpcion, onRemoveOpcion, onUpdateOpcion }: GrupoEditorProps) {
  const [newTexto, setNewTexto] = useState('')

  function handleAdd() {
    if (!newTexto.trim()) return
    onAddOpcion(newTexto)
    setNewTexto('')
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{grupo.nombre}</p>
      <div className="space-y-1.5">
        {grupo.opciones.map((op, oi) => (
          <div key={oi} className="flex items-start gap-2">
            <input
              type="text"
              value={op.texto}
              onChange={(e) => onUpdateOpcion(oi, e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 flex-1 text-xs focus:ring-1 focus:ring-emerald-400 outline-none"
            />
            <button onClick={() => onRemoveOpcion(oi)} className="text-red-400 hover:text-red-600 text-base leading-none mt-1.5 shrink-0">✕</button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTexto}
            onChange={(e) => setNewTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="+ Nueva opción..."
            className="border border-dashed border-gray-300 hover:border-emerald-400 rounded-lg px-2.5 py-1.5 flex-1 text-xs outline-none focus:border-emerald-400"
          />
          {newTexto.trim() && (
            <button onClick={handleAdd} className="text-xs text-emerald-600 font-medium hover:text-emerald-800 shrink-0">Agregar</button>
          )}
        </div>
      </div>
    </div>
  )
}
