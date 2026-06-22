'use client'

import { useState } from 'react'
import { Salad, BarChart2, Dumbbell, Calendar, Target, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { LandingData, Feature, TeamMember, Plan } from '@/lib/landing-seed'

const AVAILABLE_ICONS: { name: string; Icon: LucideIcon }[] = [
  { name: 'Salad',    Icon: Salad },
  { name: 'Dumbbell', Icon: Dumbbell },
  { name: 'BarChart2',Icon: BarChart2 },
  { name: 'Calendar', Icon: Calendar },
  { name: 'Target',   Icon: Target },
  { name: 'Users',    Icon: Users },
]

type Tab = 'hero' | 'features' | 'equipo' | 'planes'

const TABS: { key: Tab; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'features', label: 'Features' },
  { key: 'equipo', label: 'Equipo' },
  { key: 'planes', label: 'Planes' },
]

export function AdminPanel({ initialData }: { initialData: LandingData }) {
  const [activeTab, setActiveTab] = useState<Tab>('hero')
  const [hero, setHero] = useState(initialData.hero)
  const [features, setFeatures] = useState<Feature[]>(initialData.features)
  const [equipo, setEquipo] = useState<TeamMember[]>(initialData.equipo)
  const [planes, setPlanes] = useState<Plan[]>(initialData.planes)
  const [saving, setSaving] = useState(false)
  const [savedTab, setSavedTab] = useState<Tab | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function save(seccion: Tab, data: unknown) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/landing/${seccion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSavedTab(seccion)
        setTimeout(() => setSavedTab(null), 3000)
      } else {
        setError('Error al guardar. Intentá de nuevo.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Hero Tab */}
      {activeTab === 'hero' && (
        <SectionCard
          title="Sección Hero"
          onSave={() => save('hero', hero)}
          saving={saving}
          saved={savedTab === 'hero'}
        >
          <Field label="Headline">
            <input
              type="text"
              value={hero.headline}
              onChange={(e) => setHero({ ...hero, headline: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Subheadline">
            <textarea
              rows={3}
              value={hero.subheadline}
              onChange={(e) => setHero({ ...hero, subheadline: e.target.value })}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </SectionCard>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <SectionCard
          title="Features"
          onSave={() => save('features', features)}
          saving={saving}
          saved={savedTab === 'features'}
        >
          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Feature {i + 1}</span>
                  <button
                    onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-sm transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
                <div>
                  <label className={labelCls}>Ícono</label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {AVAILABLE_ICONS.map(({ name, Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setFeatures(features.map((x, j) => j === i ? { ...x, emoji: name } : x))}
                        title={name}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors border ${
                          f.emoji === name
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-600'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Título</label>
                  <input
                    type="text"
                    value={f.titulo}
                    onChange={(e) => setFeatures(features.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Descripción</label>
                  <input
                    type="text"
                    value={f.descripcion}
                    onChange={(e) => setFeatures(features.map((x, j) => j === i ? { ...x, descripcion: e.target.value } : x))}
                    className={inputCls}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setFeatures([...features, { emoji: 'Salad', titulo: '', descripcion: '' }])}
              className="w-full border border-dashed border-gray-300 hover:border-emerald-400 hover:text-emerald-600 text-gray-400 rounded-xl px-4 py-3 text-sm transition-colors"
            >
              + Agregar feature
            </button>
          </div>
        </SectionCard>
      )}

      {/* Equipo Tab */}
      {activeTab === 'equipo' && (
        <SectionCard
          title="Equipo"
          onSave={() => save('equipo', equipo)}
          saving={saving}
          saved={savedTab === 'equipo'}
        >
          <div className="space-y-4">
            {equipo.map((m, i) => (
              <MemberEditor
                key={i}
                member={m}
                index={i}
                onChange={(updated) => setEquipo(equipo.map((x, j) => j === i ? updated : x))}
                onDelete={() => setEquipo(equipo.filter((_, j) => j !== i))}
              />
            ))}
            <button
              onClick={() => setEquipo([...equipo, { nombre: '', matricula: '', rol: '', especialidades: [] }])}
              className="w-full border border-dashed border-gray-300 hover:border-emerald-400 hover:text-emerald-600 text-gray-400 rounded-xl px-4 py-3 text-sm transition-colors"
            >
              + Agregar miembro
            </button>
          </div>
        </SectionCard>
      )}

      {/* Planes Tab */}
      {activeTab === 'planes' && (
        <SectionCard
          title="Planes"
          onSave={() => save('planes', planes)}
          saving={saving}
          saved={savedTab === 'planes'}
        >
          <div className="space-y-4">
            {planes.map((p, i) => (
              <PlanEditor
                key={i}
                plan={p}
                index={i}
                onChange={(updated) => setPlanes(planes.map((x, j) => j === i ? updated : x))}
                onDelete={() => setPlanes(planes.filter((_, j) => j !== i))}
              />
            ))}
            <button
              onClick={() => setPlanes([...planes, { nombre: '', precio: '0', moneda: 'USD', periodo: 'mes', destacado: false, features: [], cta: '' }])}
              className="w-full border border-dashed border-gray-300 hover:border-emerald-400 hover:text-emerald-600 text-gray-400 rounded-xl px-4 py-3 text-sm transition-colors"
            >
              + Agregar plan
            </button>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function MemberEditor({ member, index, onChange, onDelete }: {
  member: TeamMember
  index: number
  onChange: (m: TeamMember) => void
  onDelete: () => void
}) {
  const [newTag, setNewTag] = useState('')

  function addTag() {
    const tag = newTag.trim()
    if (!tag) return
    onChange({ ...member, especialidades: [...member.especialidades, tag] })
    setNewTag('')
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Miembro {index + 1}</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 text-sm transition-colors">Eliminar</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nombre</label>
          <input type="text" value={member.nombre} onChange={(e) => onChange({ ...member, nombre: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Matrícula</label>
          <input type="text" value={member.matricula} onChange={(e) => onChange({ ...member, matricula: e.target.value })} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Rol</label>
          <input type="text" value={member.rol} onChange={(e) => onChange({ ...member, rol: e.target.value })} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Especialidades</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {member.especialidades.map((e, j) => (
            <span key={j} className="bg-emerald-100 text-emerald-700 text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5">
              {e}
              <button
                onClick={() => onChange({ ...member, especialidades: member.especialidades.filter((_, k) => k !== j) })}
                className="text-emerald-500 hover:text-emerald-700 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nueva especialidad"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            className={`${inputCls} flex-1`}
          />
          <button onClick={addTag} className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

function PlanEditor({ plan, index, onChange, onDelete }: {
  plan: Plan
  index: number
  onChange: (p: Plan) => void
  onDelete: () => void
}) {
  const [newFeature, setNewFeature] = useState('')

  function addFeature() {
    const f = newFeature.trim()
    if (!f) return
    onChange({ ...plan, features: [...plan.features, f] })
    setNewFeature('')
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Plan {index + 1}</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 text-sm transition-colors">Eliminar</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nombre</label>
          <input type="text" value={plan.nombre} onChange={(e) => onChange({ ...plan, nombre: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Precio</label>
          <input type="text" value={plan.precio} onChange={(e) => onChange({ ...plan, precio: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>CTA</label>
          <input type="text" value={plan.cta} onChange={(e) => onChange({ ...plan, cta: e.target.value })} className={inputCls} />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={plan.destacado}
              onChange={(e) => onChange({ ...plan, destacado: e.target.checked })}
              className="w-4 h-4 accent-emerald-600"
            />
            <span className="text-sm text-gray-700">Destacado (badge "Más elegido")</span>
          </label>
        </div>
      </div>
      <div>
        <label className={labelCls}>Features del plan</label>
        <ul className="space-y-1.5 mb-2">
          {plan.features.map((f, j) => (
            <li key={j} className="flex items-center gap-2">
              <input
                type="text"
                value={f}
                onChange={(e) => onChange({ ...plan, features: plan.features.map((x, k) => k === j ? e.target.value : x) })}
                className={`${inputCls} flex-1`}
              />
              <button
                onClick={() => onChange({ ...plan, features: plan.features.filter((_, k) => k !== j) })}
                className="text-red-400 hover:text-red-600 text-lg leading-none shrink-0"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nueva feature"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFeature()}
            className={`${inputCls} flex-1`}
          />
          <button onClick={addFeature} className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, children, onSave, saving, saved }: {
  title: string
  children: React.ReactNode
  onSave: () => void
  saving: boolean
  saved: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">✓ Guardado correctamente</span>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
const labelCls = "block text-xs font-medium text-gray-500 mb-1"
