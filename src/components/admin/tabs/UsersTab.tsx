'use client'

import { useState, useEffect, useCallback } from 'react'
import { GOAL_LABELS, ACTIVITY_LABELS, SEX_LABELS, TIPO_LABELS } from '@/lib/admin-translations'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface UserProfile {
  fullName: string | null
  age: number | null
  weightKg: number | null
  heightCm: number | null
  sex: string | null
  goal: string | null
  activityLevel: string | null
  onboardingCompleted: boolean
  dietaryRestrictions: string[]
}

interface AdminUser {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: string
  profile: UserProfile | null
  _count: { appointments: number }
}

interface Ejercicio {
  id: string
  routineId: string
  name: string
  sets: number
  reps: number
  orderIndex: number
}

interface Rutina {
  id: string
  name: string
  description: string | null
  exercises: Ejercicio[]
}

interface FoodItem {
  id: string
  name: string
  calories: string | number | null
  proteinG: string | number | null
  carbsG: string | number | null
  fatG: string | number | null
}

interface Meal {
  id: string
  name: string
  orderIndex: number
  foodItems: FoodItem[]
}

interface PlanNutricion {
  id: string
  name: string
  caloriesTarget: number | null
  meals: Meal[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS = ['CONSULTA_NUTRICIONAL', 'SEGUIMIENTO', 'ANTROPOMETRIA', 'CONSULTA_DEPORTIVA'] as const
const DURACIONES = [30, 45, 60, 90]

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
const tabBtnCls = (active: boolean) =>
  `flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${active ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`

function toNum(v: string | number | null | undefined) {
  if (!v) return 0
  return Number(v) || 0
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [search, setSearch] = useState('')

  // Appointment modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ fecha: '', tipo: 'CONSULTA_NUTRICIONAL', duracion: 60, notas: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Drawer tabs
  const [drawerTab, setDrawerTab] = useState<'perfil' | 'rutinas' | 'nutricion'>('perfil')

  // Role change
  const [changingRole, setChangingRole] = useState(false)
  const [roleMsg, setRoleMsg] = useState<string | null>(null)

  // ── Rutinas state ──
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [rutinasLoading, setRutinasLoading] = useState(false)
  const [expandedRutina, setExpandedRutina] = useState<string | null>(null)
  const [showNewRutinaForm, setShowNewRutinaForm] = useState(false)
  const [newRutinaName, setNewRutinaName] = useState('')
  const [newRutinaDesc, setNewRutinaDesc] = useState('')
  const [creatingRutina, setCreatingRutina] = useState(false)
  const [newEjForm, setNewEjForm] = useState<Record<string, { nombre: string; sets: string; reps: string }>>({})
  const [addingEj, setAddingEj] = useState<Record<string, boolean>>({})

  // ── Nutrición state ──
  const [planNutricion, setPlanNutricion] = useState<PlanNutricion | null | 'unloaded'>('unloaded')
  const [nutricionLoading, setNutricionLoading] = useState(false)
  const [newPlanNombre, setNewPlanNombre] = useState('')
  const [newPlanCalorias, setNewPlanCalorias] = useState('')
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [showNewMealForm, setShowNewMealForm] = useState(false)
  const [newMealNombre, setNewMealNombre] = useState('')
  const [addingMeal, setAddingMeal] = useState(false)
  const [showItemForm, setShowItemForm] = useState<Record<string, boolean>>({})
  const [itemForm, setItemForm] = useState<Record<string, { nombre: string; calorias: string; proteinas: string; carbos: string; grasas: string }>>({})
  const [addingItem, setAddingItem] = useState<Record<string, boolean>>({})

  // ── Data fetching ──
  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data: { users: AdminUser[] }) => setUsers(data.users ?? []))
      .finally(() => setLoading(false))
  }, [])

  const fetchRutinas = useCallback((userId: string) => {
    setRutinasLoading(true)
    fetch(`/api/admin/usuarios/${userId}/rutinas`)
      .then((r) => r.json())
      .then((data: { rutinas: Rutina[] }) => setRutinas(data.rutinas ?? []))
      .finally(() => setRutinasLoading(false))
  }, [])

  const fetchNutricion = useCallback((userId: string) => {
    setNutricionLoading(true)
    fetch(`/api/admin/usuarios/${userId}/nutricion`)
      .then((r) => r.json())
      .then((data: { plan: PlanNutricion | null }) => setPlanNutricion(data.plan ?? null))
      .finally(() => setNutricionLoading(false))
  }, [])

  function selectUser(u: AdminUser) {
    setSelected(u)
    setDrawerTab('perfil')
    setRutinas([])
    setPlanNutricion('unloaded')
    setExpandedRutina(null)
    setShowNewRutinaForm(false)
    setShowNewMealForm(false)
    setShowItemForm({})
    setItemForm({})
    setNewEjForm({})
  }

  function handleTabChange(tab: 'perfil' | 'rutinas' | 'nutricion') {
    setDrawerTab(tab)
    if (!selected) return
    if (tab === 'rutinas' && rutinas.length === 0 && !rutinasLoading) fetchRutinas(selected.id)
    if (tab === 'nutricion' && planNutricion === 'unloaded') fetchNutricion(selected.id)
  }

  // ── Role change ──
  async function handleRoleChange(newRole: string) {
    if (!selected || newRole === selected.role || changingRole) return
    setChangingRole(true)
    setRoleMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${selected.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setSelected({ ...selected, role: newRole })
        setUsers((prev) => prev.map((u) => u.id === selected.id ? { ...u, role: newRole } : u))
        setRoleMsg('Role actualizado. El usuario verá los cambios en su próxima sesión o en hasta 5 minutos.')
      } else {
        setRoleMsg('Error al cambiar el role.')
      }
    } finally {
      setChangingRole(false)
    }
  }

  // ── Appointment ──
  async function handleSchedule() {
    if (!selected || !form.fecha) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selected.id, fecha: form.fecha, tipo: form.tipo, duracion: form.duracion, notas: form.notas || undefined }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => { setSaved(false); setShowModal(false) }, 2000)
        setUsers((prev) => prev.map((u) => u.id === selected.id ? { ...u, _count: { appointments: u._count.appointments + 1 } } : u))
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Rutinas handlers ──
  async function handleCreateRutina() {
    if (!selected || !newRutinaName.trim()) return
    setCreatingRutina(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${selected.id}/rutinas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newRutinaName.trim(), descripcion: newRutinaDesc || undefined }),
      })
      const data = (await res.json()) as { rutina: Rutina }
      if (res.ok && data.rutina) {
        setRutinas((prev) => [data.rutina, ...prev])
        setShowNewRutinaForm(false)
        setNewRutinaName('')
        setNewRutinaDesc('')
      }
    } finally {
      setCreatingRutina(false)
    }
  }

  async function handleDeleteRutina(rutinaId: string) {
    if (!selected) return
    await fetch(`/api/admin/usuarios/${selected.id}/rutinas/${rutinaId}`, { method: 'DELETE' })
    setRutinas((prev) => prev.filter((r) => r.id !== rutinaId))
    if (expandedRutina === rutinaId) setExpandedRutina(null)
  }

  function getEjForm(rutinaId: string) {
    return newEjForm[rutinaId] ?? { nombre: '', sets: '', reps: '' }
  }

  async function handleAddEjercicio(rutinaId: string) {
    if (!selected) return
    const f = getEjForm(rutinaId)
    if (!f.nombre.trim() || !f.sets || !f.reps) return
    setAddingEj((prev) => ({ ...prev, [rutinaId]: true }))
    try {
      const orden = (rutinas.find((r) => r.id === rutinaId)?.exercises.length) ?? 0
      const res = await fetch(`/api/admin/usuarios/${selected.id}/rutinas/${rutinaId}/ejercicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: f.nombre.trim(), sets: parseInt(f.sets), reps: parseInt(f.reps), orden }),
      })
      const data = (await res.json()) as { ejercicio: Ejercicio }
      if (res.ok && data.ejercicio) {
        setRutinas((prev) => prev.map((r) => r.id === rutinaId ? { ...r, exercises: [...r.exercises, data.ejercicio] } : r))
        setNewEjForm((prev) => ({ ...prev, [rutinaId]: { nombre: '', sets: '', reps: '' } }))
      }
    } finally {
      setAddingEj((prev) => ({ ...prev, [rutinaId]: false }))
    }
  }

  async function handleDeleteEjercicio(rutinaId: string, ejercicioId: string) {
    if (!selected) return
    await fetch(`/api/admin/usuarios/${selected.id}/rutinas/${rutinaId}/ejercicios/${ejercicioId}`, { method: 'DELETE' })
    setRutinas((prev) => prev.map((r) => r.id === rutinaId ? { ...r, exercises: r.exercises.filter((e) => e.id !== ejercicioId) } : r))
  }

  // ── Nutrición handlers ──
  async function handleCreatePlan() {
    if (!selected || !newPlanNombre.trim()) return
    setCreatingPlan(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${selected.id}/nutricion/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newPlanNombre.trim(), objetivoCalorico: newPlanCalorias || undefined }),
      })
      const data = (await res.json()) as { plan: PlanNutricion }
      if (res.ok && data.plan) {
        setPlanNutricion({ ...data.plan, meals: [] })
        setNewPlanNombre('')
        setNewPlanCalorias('')
      }
    } finally {
      setCreatingPlan(false)
    }
  }

  async function handleAddMeal() {
    if (!selected || !newMealNombre.trim() || !planNutricion || planNutricion === 'unloaded') return
    setAddingMeal(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${selected.id}/nutricion/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newMealNombre.trim(), orden: planNutricion.meals.length }),
      })
      const data = (await res.json()) as { meal: Meal }
      if (res.ok && data.meal) {
        setPlanNutricion((prev) => prev && prev !== 'unloaded' ? { ...prev, meals: [...prev.meals, data.meal] } : prev)
        setNewMealNombre('')
        setShowNewMealForm(false)
      }
    } finally {
      setAddingMeal(false)
    }
  }

  async function handleDeleteMeal(mealId: string) {
    if (!selected) return
    await fetch(`/api/admin/usuarios/${selected.id}/nutricion/meals/${mealId}`, { method: 'DELETE' })
    setPlanNutricion((prev) => prev && prev !== 'unloaded' ? { ...prev, meals: prev.meals.filter((m) => m.id !== mealId) } : prev)
  }

  function getItemForm(mealId: string) {
    return itemForm[mealId] ?? { nombre: '', calorias: '', proteinas: '', carbos: '', grasas: '' }
  }

  async function handleAddItem(mealId: string) {
    if (!selected) return
    const f = getItemForm(mealId)
    if (!f.nombre.trim()) return
    setAddingItem((prev) => ({ ...prev, [mealId]: true }))
    try {
      const res = await fetch(`/api/admin/usuarios/${selected.id}/nutricion/meals/${mealId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: f.nombre.trim(), calorias: f.calorias || undefined, proteinas: f.proteinas || undefined, carbos: f.carbos || undefined, grasas: f.grasas || undefined }),
      })
      const data = (await res.json()) as { item: FoodItem }
      if (res.ok && data.item) {
        setPlanNutricion((prev) => prev && prev !== 'unloaded' ? {
          ...prev,
          meals: prev.meals.map((m) => m.id === mealId ? { ...m, foodItems: [...m.foodItems, data.item] } : m)
        } : prev)
        setItemForm((prev) => ({ ...prev, [mealId]: { nombre: '', calorias: '', proteinas: '', carbos: '', grasas: '' } }))
      }
    } finally {
      setAddingItem((prev) => ({ ...prev, [mealId]: false }))
    }
  }

  async function handleDeleteItem(mealId: string, itemId: string) {
    if (!selected) return
    await fetch(`/api/admin/usuarios/${selected.id}/nutricion/meals/${mealId}/items/${itemId}`, { method: 'DELETE' })
    setPlanNutricion((prev) => prev && prev !== 'unloaded' ? {
      ...prev,
      meals: prev.meals.map((m) => m.id === mealId ? { ...m, foodItems: m.foodItems.filter((i) => i.id !== itemId) } : m)
    } : prev)
  }

  // ── Filtered users ──
  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q) || (u.profile?.fullName ?? '').toLowerCase().includes(q)
  })

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="bg-gray-100 animate-pulse rounded-xl h-10 w-64" />
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-14" />)}
      </div>
    )
  }

  const plan = planNutricion !== 'unloaded' ? planNutricion : null
  const totalCal = plan ? plan.meals.flatMap((m) => m.foodItems).reduce((s, i) => s + toNum(i.calories), 0) : 0

  return (
    <div>
      {/* Header + search */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} registrados</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-60 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Objetivo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Registro</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Turnos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} onClick={() => selectUser(u)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                      {(u.profile?.fullName ?? u.name ?? u.email ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.profile?.fullName ?? u.name ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {u.profile?.onboardingCompleted
                    ? <span className="bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full px-2.5 py-0.5">Perfil completo</span>
                    : <span className="bg-gray-100 text-gray-500 text-xs font-medium rounded-full px-2.5 py-0.5">Sin perfil</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                  {u.profile?.goal ? (GOAL_LABELS[u.profile.goal] ?? u.profile.goal) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">
                  {new Date(u.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-gray-700 font-medium">{u._count.appointments}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-xl z-50 flex flex-col overflow-hidden">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {(selected.profile?.fullName ?? selected.name ?? selected.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{selected.profile?.fullName ?? selected.name ?? '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-2 shrink-0">×</button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-gray-100 shrink-0">
              {(['perfil', 'rutinas', 'nutricion'] as const).map((t) => (
                <button key={t} onClick={() => handleTabChange(t)} className={tabBtnCls(drawerTab === t)}>
                  {t === 'perfil' ? 'Perfil' : t === 'rutinas' ? 'Rutinas' : 'Nutrición'}
                </button>
              ))}
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── PERFIL TAB ── */}
              {drawerTab === 'perfil' && (
                <div className="px-5 py-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 shrink-0">Rol:</span>
                    <select
                      value={selected.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      disabled={changingRole}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      <option value="USER">USER</option>
                      <option value="NUTRICIONISTA">NUTRICIONISTA</option>
                      <option value="RECEPCIONISTA">RECEPCIONISTA</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    {changingRole && <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                  </div>
                  {roleMsg && (
                    <p className={`text-xs rounded-lg px-3 py-2 ${roleMsg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                      {roleMsg}
                    </p>
                  )}

                  {selected.profile?.onboardingCompleted ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Edad', value: selected.profile.age ? `${selected.profile.age} años` : '—' },
                          { label: 'Peso', value: selected.profile.weightKg ? `${selected.profile.weightKg} kg` : '—' },
                          { label: 'Altura', value: selected.profile.heightCm ? `${selected.profile.heightCm} cm` : '—' },
                          { label: 'Sexo', value: selected.profile.sex ? (SEX_LABELS[selected.profile.sex] ?? selected.profile.sex) : '—' },
                        ].map((item) => (
                          <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Objetivo</span>
                          <span className="text-sm font-medium text-gray-900">
                            {selected.profile.goal ? (GOAL_LABELS[selected.profile.goal] ?? selected.profile.goal) : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Actividad</span>
                          <span className="text-sm font-medium text-gray-900">
                            {selected.profile.activityLevel ? (ACTIVITY_LABELS[selected.profile.activityLevel] ?? selected.profile.activityLevel) : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-500">Turnos</span>
                          <span className="text-sm font-medium text-gray-900">{selected._count.appointments}</span>
                        </div>
                      </div>

                      {selected.profile.dietaryRestrictions?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Restricciones alimentarias</p>
                          <div className="flex flex-wrap gap-2">
                            {selected.profile.dietaryRestrictions.map((r, i) => (
                              <span key={i} className="bg-amber-50 text-amber-700 text-xs rounded-full px-2.5 py-1 font-medium">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-500">Este usuario no completó el onboarding</p>
                    </div>
                  )}

                  <button
                    onClick={() => { setShowModal(true); setForm({ fecha: '', tipo: 'CONSULTA_NUTRICIONAL', duracion: 60, notas: '' }) }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                  >
                    Agendar turno
                  </button>
                </div>
              )}

              {/* ── RUTINAS TAB ── */}
              {drawerTab === 'rutinas' && (
                <div className="px-5 py-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">{rutinas.length} rutina{rutinas.length !== 1 ? 's' : ''}</p>
                    <button
                      onClick={() => setShowNewRutinaForm((v) => !v)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                    >
                      + Nueva rutina
                    </button>
                  </div>

                  {showNewRutinaForm && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre de la rutina"
                        value={newRutinaName}
                        onChange={(e) => setNewRutinaName(e.target.value)}
                        className={inputCls}
                      />
                      <input
                        type="text"
                        placeholder="Descripción (opcional)"
                        value={newRutinaDesc}
                        onChange={(e) => setNewRutinaDesc(e.target.value)}
                        className={inputCls}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setShowNewRutinaForm(false); setNewRutinaName(''); setNewRutinaDesc('') }}
                          className="border border-gray-300 text-gray-600 text-xs rounded-lg px-3 py-1.5 hover:bg-gray-100">
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateRutina}
                          disabled={!newRutinaName.trim() || creatingRutina}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs rounded-lg px-3 py-1.5 transition-colors">
                          {creatingRutina ? 'Creando...' : 'Crear'}
                        </button>
                      </div>
                    </div>
                  )}

                  {rutinasLoading && (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-12" />)}
                    </div>
                  )}

                  {!rutinasLoading && rutinas.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-400">Sin rutinas aún</div>
                  )}

                  {rutinas.map((rutina) => {
                    const isExpanded = expandedRutina === rutina.id
                    const ejForm = getEjForm(rutina.id)
                    return (
                      <div key={rutina.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpandedRutina(isExpanded ? null : rutina.id)}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{rutina.name}</p>
                            <p className="text-xs text-gray-400">{rutina.exercises.length} ejercicio{rutina.exercises.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteRutina(rutina.id) }}
                              className="text-red-400 hover:text-red-600 text-xs transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2">
                            {rutina.description && (
                              <p className="text-xs text-gray-500 mb-2">{rutina.description}</p>
                            )}

                            {rutina.exercises.length === 0 ? (
                              <p className="text-xs text-gray-400">Sin ejercicios</p>
                            ) : (
                              rutina.exercises.map((ex) => (
                                <div key={ex.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                  <span className="text-sm text-gray-800">{ex.name}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">{ex.sets}×{ex.reps}</span>
                                    <button
                                      onClick={() => handleDeleteEjercicio(rutina.id, ex.id)}
                                      className="text-red-400 hover:text-red-600 text-sm leading-none"
                                    >×</button>
                                  </div>
                                </div>
                              ))
                            )}

                            {/* Agregar ejercicio */}
                            <div className="pt-2 space-y-2">
                              <input
                                type="text"
                                placeholder="Nombre del ejercicio"
                                value={ejForm.nombre}
                                onChange={(e) => setNewEjForm((prev) => ({ ...prev, [rutina.id]: { ...getEjForm(rutina.id), nombre: e.target.value } }))}
                                className={inputCls}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number" min="1" placeholder="Series"
                                  value={ejForm.sets}
                                  onChange={(e) => setNewEjForm((prev) => ({ ...prev, [rutina.id]: { ...getEjForm(rutina.id), sets: e.target.value } }))}
                                  className={inputCls}
                                />
                                <input
                                  type="number" min="1" placeholder="Reps"
                                  value={ejForm.reps}
                                  onChange={(e) => setNewEjForm((prev) => ({ ...prev, [rutina.id]: { ...getEjForm(rutina.id), reps: e.target.value } }))}
                                  className={inputCls}
                                />
                              </div>
                              <button
                                onClick={() => handleAddEjercicio(rutina.id)}
                                disabled={!ejForm.nombre.trim() || !ejForm.sets || !ejForm.reps || addingEj[rutina.id]}
                                className="w-full border border-emerald-600 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 rounded-lg py-1.5 text-xs font-medium transition-colors"
                              >
                                {addingEj[rutina.id] ? 'Agregando...' : '+ Agregar ejercicio'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── NUTRICIÓN TAB ── */}
              {drawerTab === 'nutricion' && (
                <div className="px-5 py-5 space-y-3">
                  {nutricionLoading && (
                    <div className="space-y-2">
                      <div className="bg-gray-100 animate-pulse rounded-xl h-20" />
                      <div className="bg-gray-100 animate-pulse rounded-xl h-32" />
                    </div>
                  )}

                  {!nutricionLoading && planNutricion === 'unloaded' && null}

                  {!nutricionLoading && (plan === null) && (
                    <div className="bg-gray-50 rounded-xl p-6 text-center space-y-3">
                      <p className="text-sm text-gray-500">Este usuario no tiene plan nutricional</p>
                      <div className="space-y-2 text-left">
                        <input
                          type="text"
                          placeholder="Nombre del plan"
                          value={newPlanNombre}
                          onChange={(e) => setNewPlanNombre(e.target.value)}
                          className={inputCls}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Objetivo calórico (opcional)"
                          value={newPlanCalorias}
                          onChange={(e) => setNewPlanCalorias(e.target.value)}
                          className={inputCls}
                        />
                        <button
                          onClick={handleCreatePlan}
                          disabled={!newPlanNombre.trim() || creatingPlan}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                        >
                          {creatingPlan ? 'Creando...' : 'Crear plan'}
                        </button>
                      </div>
                    </div>
                  )}

                  {!nutricionLoading && plan && (
                    <>
                      {/* Plan header */}
                      <div className="bg-emerald-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">{plan.name}</p>
                            {plan.caloriesTarget && (
                              <p className="text-xs text-emerald-600 mt-0.5">Objetivo: {plan.caloriesTarget} kcal</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-700">{Math.round(totalCal)}</p>
                            <p className="text-xs text-emerald-600">kcal totales</p>
                          </div>
                        </div>
                      </div>

                      {/* Nueva comida */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">{plan.meals.length} comida{plan.meals.length !== 1 ? 's' : ''}</p>
                        <button
                          onClick={() => setShowNewMealForm((v) => !v)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                        >
                          + Comida
                        </button>
                      </div>

                      {showNewMealForm && (
                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                          <input
                            type="text"
                            placeholder="Ej: Desayuno"
                            value={newMealNombre}
                            onChange={(e) => setNewMealNombre(e.target.value)}
                            className={inputCls}
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setShowNewMealForm(false); setNewMealNombre('') }}
                              className="border border-gray-300 text-gray-600 text-xs rounded-lg px-3 py-1.5 hover:bg-gray-100">Cancelar</button>
                            <button
                              onClick={handleAddMeal}
                              disabled={!newMealNombre.trim() || addingMeal}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs rounded-lg px-3 py-1.5">
                              {addingMeal ? 'Agregando...' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Meals */}
                      {plan.meals.map((meal) => {
                        const mealCal = meal.foodItems.reduce((s, i) => s + toNum(i.calories), 0)
                        const iForm = getItemForm(meal.id)
                        const showingItemForm = showItemForm[meal.id]
                        return (
                          <div key={meal.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">{meal.name}</span>
                                {mealCal > 0 && (
                                  <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">{Math.round(mealCal)} kcal</span>
                                )}
                              </div>
                              <button onClick={() => handleDeleteMeal(meal.id)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                            </div>

                            <div className="px-4 pb-4 pt-3 space-y-2">
                              {meal.foodItems.length === 0 ? (
                                <p className="text-xs text-gray-400">Sin alimentos</p>
                              ) : (
                                meal.foodItems.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                                    <div>
                                      <p className="text-xs font-medium text-gray-800">{item.name}</p>
                                      <div className="flex gap-2 mt-0.5">
                                        {toNum(item.calories) > 0 && <span className="text-[10px] text-gray-400">{Math.round(toNum(item.calories))} kcal</span>}
                                        {toNum(item.proteinG) > 0 && <span className="text-[10px] text-blue-400">P:{toNum(item.proteinG)}g</span>}
                                        {toNum(item.carbsG) > 0 && <span className="text-[10px] text-amber-400">C:{toNum(item.carbsG)}g</span>}
                                        {toNum(item.fatG) > 0 && <span className="text-[10px] text-red-400">G:{toNum(item.fatG)}g</span>}
                                      </div>
                                    </div>
                                    <button onClick={() => handleDeleteItem(meal.id, item.id)} className="text-red-400 hover:text-red-600 text-sm leading-none ml-2">×</button>
                                  </div>
                                ))
                              )}

                              {!showingItemForm ? (
                                <button
                                  onClick={() => setShowItemForm((prev) => ({ ...prev, [meal.id]: true }))}
                                  className="w-full border border-dashed border-gray-300 hover:border-emerald-400 hover:text-emerald-600 text-gray-400 rounded-lg py-1.5 text-xs transition-colors"
                                >
                                  + Agregar alimento
                                </button>
                              ) : (
                                <div className="space-y-2 pt-1">
                                  <input type="text" placeholder="Nombre del alimento" value={iForm.nombre}
                                    onChange={(e) => setItemForm((prev) => ({ ...prev, [meal.id]: { ...getItemForm(meal.id), nombre: e.target.value } }))}
                                    className={inputCls} />
                                  <div className="grid grid-cols-2 gap-2">
                                    {(['calorias', 'proteinas', 'carbos', 'grasas'] as const).map((field) => (
                                      <input key={field} type="number" min="0"
                                        placeholder={field === 'calorias' ? 'Calorías' : field === 'proteinas' ? 'Proteínas (g)' : field === 'carbos' ? 'Carbos (g)' : 'Grasas (g)'}
                                        value={iForm[field]}
                                        onChange={(e) => setItemForm((prev) => ({ ...prev, [meal.id]: { ...getItemForm(meal.id), [field]: e.target.value } }))}
                                        className={inputCls} />
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setShowItemForm((prev) => ({ ...prev, [meal.id]: false }))}
                                      className="flex-1 border border-gray-300 text-gray-600 text-xs rounded-lg py-1.5 hover:bg-gray-50"
                                    >Cancelar</button>
                                    <button
                                      onClick={() => handleAddItem(meal.id)}
                                      disabled={!iForm.nombre.trim() || addingItem[meal.id]}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs rounded-lg py-1.5"
                                    >{addingItem[meal.id] ? 'Agregando...' : 'Agregar'}</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Modal agendar turno */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nuevo turno</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-emerald-50 rounded-lg px-3 py-2 text-sm text-emerald-700 font-medium">
                {selected.profile?.fullName ?? selected.name ?? selected.email}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha y hora</label>
                <input type="datetime-local" value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de consulta</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputCls}>
                  {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Duración</label>
                <select value={form.duracion} onChange={(e) => setForm({ ...form, duracion: parseInt(e.target.value) })} className={inputCls}>
                  {DURACIONES.map((d) => <option key={d} value={d}>{d} minutos</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notas (opcional)</label>
                <textarea rows={2} value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones..."
                  className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 justify-end">
              {saved && <span className="text-sm text-emerald-600 self-center">✓ Turno agendado</span>}
              <button onClick={() => setShowModal(false)} className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium">Cancelar</button>
              <button
                onClick={handleSchedule}
                disabled={!form.fecha || saving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
              >
                {saving ? 'Guardando...' : 'Confirmar turno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
