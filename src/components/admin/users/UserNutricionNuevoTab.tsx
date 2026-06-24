'use client'

import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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

interface PlanOpcion {
  id: string
  texto: string
  orden: number
}

interface PlanGrupo {
  id: string
  nombre: string
  orden: number
  opciones: PlanOpcion[]
}

interface PlanComida {
  id: string
  nombre: string
  orden: number
  nota: string | null
  ideasMenu: string | null
  grupos: PlanGrupo[]
}

interface PlanNutricional {
  id: string
  nombre: string
  objetivo: ObjetivoPlan
  notaNutricionista: string | null
  recomendaciones: string | null
  suplementos: string | null
  fromTemplateId: string | null
  comidas: PlanComida[]
}

interface TemplateSummary {
  id: string
  nombre: string
  objetivo: ObjetivoPlan
  descripcion: string | null
}

interface Props {
  userId: string
}

const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm'
const textareaCls = 'border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none'

export function UserNutricionNuevoTab({ userId }: Props) {
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(false)
  const [plan, setPlan] = useState<PlanNutricional | null | 'loading'>('loading')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [notaNutricionista, setNotaNutricionista] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')
  const [expandedComidas, setExpandedComidas] = useState<Record<string, boolean>>({})

  // Edit states
  const [editingNota, setEditingNota] = useState(false)
  const [notaValue, setNotaValue] = useState('')
  const [savingNota, setSavingNota] = useState(false)
  const [editingRecs, setEditingRecs] = useState(false)
  const [recsValue, setRecsValue] = useState('')
  const [savingRecs, setSavingRecs] = useState(false)

  useEffect(() => {
    loadPlan()
  }, [userId])

  async function loadPlan() {
    setPlan('loading')
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/plan-nutricional`)
      const data = await res.json() as { plan: PlanNutricional | null }
      setPlan(data.plan ?? null)
    } catch {
      setPlan(null)
    }
  }

  async function openAssignModal() {
    setShowAssignModal(true)
    setLoadingTemplates(true)
    try {
      const res = await fetch('/api/admin/templates-nutricionales')
      const data = await res.json() as { templates: TemplateSummary[] }
      setTemplates(data.templates ?? [])
      if (data.templates?.[0]) setSelectedTemplateId(data.templates[0].id)
    } finally {
      setLoadingTemplates(false)
    }
  }

  async function handleAssign() {
    if (!selectedTemplateId) return
    setAssigning(true)
    setAssignError('')
    try {
      const res = await fetch('/api/admin/planes-nutricionales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplateId, userId, notaNutricionista: notaNutricionista || undefined }),
      })
      const data = await res.json() as { plan?: unknown; error?: string }
      if (!res.ok) {
        setAssignError(data.error ?? `Error ${res.status} al asignar plan`)
        return
      }
      setShowAssignModal(false)
      setNotaNutricionista('')
      setAssignError('')
      await loadPlan()
    } catch {
      setAssignError('Error de conexión al asignar plan')
    } finally {
      setAssigning(false)
    }
  }

  async function handleDeletePlan() {
    if (!plan || plan === 'loading') return
    setConfirmDeletePlan(false)
    await fetch(`/api/admin/planes-nutricionales/${plan.id}`, { method: 'DELETE' })
    setPlan(null)
  }

  async function saveNota() {
    if (!plan || plan === 'loading') return
    setSavingNota(true)
    try {
      const res = await fetch(`/api/admin/planes-nutricionales/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notaNutricionista: notaValue || null }),
      })
      const data = await res.json() as { plan: PlanNutricional }
      if (res.ok) {
        setPlan((prev) => prev && prev !== 'loading' ? { ...prev, notaNutricionista: data.plan.notaNutricionista } : prev)
        setEditingNota(false)
      }
    } finally {
      setSavingNota(false)
    }
  }

  async function saveRecs() {
    if (!plan || plan === 'loading') return
    setSavingRecs(true)
    try {
      const res = await fetch(`/api/admin/planes-nutricionales/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recomendaciones: recsValue || null }),
      })
      const data = await res.json() as { plan: PlanNutricional }
      if (res.ok) {
        setPlan((prev) => prev && prev !== 'loading' ? { ...prev, recomendaciones: data.plan.recomendaciones } : prev)
        setEditingRecs(false)
      }
    } finally {
      setSavingRecs(false)
    }
  }

  async function saveComidaField(comidaId: string, planId: string, field: 'nota' | 'ideasMenu', value: string) {
    await fetch(`/api/admin/planes-nutricionales/${planId}/comidas/${comidaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value || null }),
    })
    setPlan((prev) => {
      if (!prev || prev === 'loading') return prev
      return {
        ...prev,
        comidas: prev.comidas.map((c) => c.id === comidaId ? { ...c, [field]: value || null } : c),
      }
    })
  }

  async function addOpcion(planId: string, comidaId: string, grupoId: string, texto: string) {
    const res = await fetch(`/api/admin/planes-nutricionales/${planId}/comidas/${comidaId}/grupos/${grupoId}/opciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    })
    const data = await res.json() as { opcion: PlanOpcion }
    if (res.ok && data.opcion) {
      setPlan((prev) => {
        if (!prev || prev === 'loading') return prev
        return {
          ...prev,
          comidas: prev.comidas.map((c) =>
            c.id === comidaId ? {
              ...c,
              grupos: c.grupos.map((g) =>
                g.id === grupoId ? { ...g, opciones: [...g.opciones, data.opcion] } : g
              ),
            } : c
          ),
        }
      })
    }
  }

  async function editOpcion(planId: string, comidaId: string, grupoId: string, opcionId: string, texto: string) {
    await fetch(`/api/admin/planes-nutricionales/${planId}/comidas/${comidaId}/grupos/${grupoId}/opciones`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opcionId, texto }),
    })
    setPlan((prev) => {
      if (!prev || prev === 'loading') return prev
      return {
        ...prev,
        comidas: prev.comidas.map((c) =>
          c.id === comidaId ? {
            ...c,
            grupos: c.grupos.map((g) =>
              g.id === grupoId ? { ...g, opciones: g.opciones.map((o) => o.id === opcionId ? { ...o, texto } : o) } : g
            ),
          } : c
        ),
      }
    })
  }

  async function deleteOpcion(planId: string, comidaId: string, grupoId: string, opcionId: string) {
    await fetch(`/api/admin/planes-nutricionales/${planId}/comidas/${comidaId}/grupos/${grupoId}/opciones`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opcionId }),
    })
    setPlan((prev) => {
      if (!prev || prev === 'loading') return prev
      return {
        ...prev,
        comidas: prev.comidas.map((c) =>
          c.id === comidaId ? {
            ...c,
            grupos: c.grupos.map((g) =>
              g.id === grupoId ? { ...g, opciones: g.opciones.filter((o) => o.id !== opcionId) } : g
            ),
          } : c
        ),
      }
    })
  }

  if (plan === 'loading') {
    return (
      <div className="px-5 py-5 space-y-3">
        <div className="bg-gray-100 animate-pulse rounded-xl h-20" />
        <div className="bg-gray-100 animate-pulse rounded-xl h-32" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="px-5 py-5">
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Este paciente no tiene plan nutricional asignado.</p>
          <button onClick={openAssignModal} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
            Asignar template
          </button>
        </div>

        {showAssignModal && (
          <AssignModal
            templates={templates}
            loading={loadingTemplates}
            selectedId={selectedTemplateId}
            nota={notaNutricionista}
            assigning={assigning}
            error={assignError}
            onSelectTemplate={setSelectedTemplateId}
            onChangeNota={setNotaNutricionista}
            onAssign={handleAssign}
            onClose={() => { setShowAssignModal(false); setAssignError('') }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="px-5 py-5 space-y-4">
      {/* Header del plan */}
      <div className="bg-emerald-50 rounded-xl p-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-900">{plan.nombre}</p>
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 mt-1 inline-block ${OBJETIVO_COLORS[plan.objetivo]}`}>
            {OBJETIVO_LABELS[plan.objetivo]}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={openAssignModal} className="text-xs text-emerald-700 font-medium border border-emerald-300 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 transition-colors">
            Cambiar template
          </button>
          <button onClick={() => setConfirmDeletePlan(true)} className="text-xs text-red-400 hover:text-red-600 font-medium">Eliminar</button>
        </div>
      </div>

      {/* Nota del nutricionista */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nota para el paciente</p>
          {!editingNota && (
            <button onClick={() => { setNotaValue(plan.notaNutricionista ?? ''); setEditingNota(true) }} className="text-xs text-emerald-600 font-medium">Editar</button>
          )}
        </div>
        {editingNota ? (
          <div className="space-y-2">
            <textarea rows={3} value={notaValue} onChange={(e) => setNotaValue(e.target.value)} className={textareaCls} placeholder="Mensaje personalizado para este paciente..." />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingNota(false)} className="text-xs border border-gray-300 text-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50">Cancelar</button>
              <button onClick={saveNota} disabled={savingNota} className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5">
                {savingNota ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">{plan.notaNutricionista ?? <span className="text-gray-400 italic">Sin nota</span>}</p>
        )}
      </div>

      {/* Comidas */}
      {plan.comidas.map((comida) => (
        <div key={comida.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedComidas((prev) => ({ ...prev, [comida.id]: !prev[comida.id] }))}
          >
            <span className="font-semibold text-sm text-gray-800">{comida.nombre}</span>
            <span className="text-gray-400">{expandedComidas[comida.id] ? '▲' : '▼'}</span>
          </button>

          {expandedComidas[comida.id] && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
              {/* Nota de comida */}
              <ComidaNotaEditor
                value={comida.nota}
                onSave={(val) => saveComidaField(comida.id, plan.id, 'nota', val)}
              />

              {/* Grupos */}
              {comida.grupos.map((grupo) => (
                <GrupoOpcionesEditor
                  key={grupo.id}
                  grupo={grupo}
                  onAdd={(texto) => addOpcion(plan.id, comida.id, grupo.id, texto)}
                  onEdit={(opcionId, texto) => editOpcion(plan.id, comida.id, grupo.id, opcionId, texto)}
                  onDelete={(opcionId) => deleteOpcion(plan.id, comida.id, grupo.id, opcionId)}
                />
              ))}

              {/* Ideas de menú */}
              <IdeasMenuEditor
                value={comida.ideasMenu}
                onSave={(val) => saveComidaField(comida.id, plan.id, 'ideasMenu', val)}
              />
            </div>
          )}
        </div>
      ))}

      {/* Recomendaciones */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recomendaciones</p>
          {!editingRecs && (
            <button onClick={() => { setRecsValue(plan.recomendaciones ?? ''); setEditingRecs(true) }} className="text-xs text-emerald-600 font-medium">Editar</button>
          )}
        </div>
        {editingRecs ? (
          <div className="space-y-2">
            <textarea rows={5} value={recsValue} onChange={(e) => setRecsValue(e.target.value)} className={textareaCls} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingRecs(false)} className="text-xs border border-gray-300 text-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50">Cancelar</button>
              <button onClick={saveRecs} disabled={savingRecs} className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5">
                {savingRecs ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{plan.recomendaciones ?? <span className="text-gray-400 italic">Sin recomendaciones</span>}</p>
        )}
      </div>

      {showAssignModal && (
        <AssignModal
          templates={templates}
          loading={loadingTemplates}
          selectedId={selectedTemplateId}
          nota={notaNutricionista}
          assigning={assigning}
          error={assignError}
          onSelectTemplate={setSelectedTemplateId}
          onChangeNota={setNotaNutricionista}
          onAssign={handleAssign}
          onClose={() => { setShowAssignModal(false); setAssignError('') }}
        />
      )}

      {confirmDeletePlan && (
        <ConfirmDialog
          message="¿Eliminar el plan nutricional de este paciente? Esta acción no se puede deshacer."
          onConfirm={handleDeletePlan}
          onCancel={() => setConfirmDeletePlan(false)}
        />
      )}
    </div>
  )
}

// Sub-componentes

interface AssignModalProps {
  templates: TemplateSummary[]
  loading: boolean
  selectedId: string
  nota: string
  assigning: boolean
  error?: string
  onSelectTemplate: (id: string) => void
  onChangeNota: (v: string) => void
  onAssign: () => void
  onClose: () => void
}

function AssignModal({ templates, loading, selectedId, nota, assigning, error, onSelectTemplate, onChangeNota, onAssign, onClose }: AssignModalProps) {
  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm'
  const textareaCls = 'border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none'
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Asignar template nutricional</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {loading ? (
            <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {templates.map((t) => (
                <label key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedId === t.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="template" value={t.id} checked={selectedId === t.id} onChange={() => onSelectTemplate(t.id)} className="mt-0.5 accent-emerald-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{t.nombre}</p>
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${OBJETIVO_COLORS[t.objetivo]}`}>{OBJETIVO_LABELS[t.objetivo]}</span>
                    {t.descripcion && <p className="text-xs text-gray-500 mt-0.5 truncate">{t.descripcion}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nota personalizada (opcional)</label>
            <textarea rows={2} value={nota} onChange={(e) => onChangeNota(e.target.value)} className={textareaCls} placeholder="Mensaje personalizado para este paciente..." />
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 justify-end">
          {error && <p className="text-xs text-red-600 mr-auto">{error}</p>}
          <button onClick={onClose} className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium">Cancelar</button>
          <button onClick={onAssign} disabled={!selectedId || assigning} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors">
            {assigning ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ComidaNotaEditor({ value, onSave }: { value: string | null; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm'
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 font-medium">Nota de la comida</span>
        {!editing && <button onClick={() => { setVal(value ?? ''); setEditing(true) }} className="text-xs text-emerald-600">Editar</button>}
      </div>
      {editing ? (
        <div className="flex gap-2">
          <input type="text" value={val} onChange={(e) => setVal(e.target.value)} className={inputCls} placeholder="Ej: HIDRATACIÓN CON AGUA" />
          <button onClick={() => { onSave(val); setEditing(false) }} className="text-xs bg-emerald-600 text-white rounded-lg px-3 shrink-0">OK</button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">✕</button>
        </div>
      ) : value ? (
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 font-medium">{value}</p>
      ) : null}
    </div>
  )
}

function IdeasMenuEditor({ value, onSave }: { value: string | null; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const textareaCls = 'border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 font-medium">Ideas de menú</span>
        {!editing && <button onClick={() => { setVal(value ?? ''); setEditing(true) }} className="text-xs text-emerald-600">Editar</button>}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea rows={3} value={val} onChange={(e) => setVal(e.target.value)} className={textareaCls} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="text-xs border border-gray-300 text-gray-600 rounded-lg px-3 py-1.5">Cancelar</button>
            <button onClick={() => { onSave(val); setEditing(false) }} className="text-xs bg-emerald-600 text-white rounded-lg px-3 py-1.5">Guardar</button>
          </div>
        </div>
      ) : value ? (
        <p className="text-xs text-gray-500 italic whitespace-pre-wrap">{value}</p>
      ) : null}
    </div>
  )
}

interface GrupoOpcionesEditorProps {
  grupo: PlanGrupo
  onAdd: (texto: string) => void
  onEdit: (opcionId: string, texto: string) => void
  onDelete: (opcionId: string) => void
}

function GrupoOpcionesEditor({ grupo, onAdd, onEdit, onDelete }: GrupoOpcionesEditorProps) {
  const [newTexto, setNewTexto] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  function handleAdd() {
    if (!newTexto.trim()) return
    onAdd(newTexto.trim())
    setNewTexto('')
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{grupo.nombre}</p>
      <div className="space-y-1">
        {grupo.opciones.map((op) => (
          <div key={op.id} className="flex items-start gap-2">
            {editingId === op.id ? (
              <>
                <input type="text" value={editVal} onChange={(e) => setEditVal(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 flex-1 text-xs focus:ring-1 focus:ring-emerald-400 outline-none" />
                <button onClick={() => { onEdit(op.id, editVal); setEditingId(null) }} className="text-xs text-emerald-600 font-medium shrink-0 mt-1">OK</button>
                <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 shrink-0 mt-1">✕</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs text-gray-700 bg-gray-50 rounded px-2.5 py-1.5 leading-relaxed">{op.texto}</span>
                <button onClick={() => { setEditingId(op.id); setEditVal(op.texto) }} className="text-xs text-gray-400 hover:text-emerald-600 shrink-0 mt-1">✎</button>
                <button onClick={() => onDelete(op.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0 mt-1">✕</button>
              </>
            )}
          </div>
        ))}
        <div className="flex gap-2 mt-1">
          <input type="text" value={newTexto} onChange={(e) => setNewTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="+ Nueva opción..."
            className="border border-dashed border-gray-300 hover:border-emerald-400 rounded-lg px-2.5 py-1.5 flex-1 text-xs outline-none focus:border-emerald-400" />
          {newTexto.trim() && (
            <button onClick={handleAdd} className="text-xs text-emerald-600 font-medium hover:text-emerald-800 shrink-0">Agregar</button>
          )}
        </div>
      </div>
    </div>
  )
}
