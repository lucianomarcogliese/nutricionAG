'use client'

import { useState, useEffect, useCallback } from 'react'
import { TIPO_LABELS, ESTADO_COLORS } from '@/lib/admin-translations'

interface AppointmentUser {
  id: string
  name: string | null
  email: string | null
}

interface AppointmentNutritionist {
  id: string
  nombre: string
  color: string
  matricula: string
}

interface Appointment {
  id: string
  userId: string
  fecha: string
  duracion: number
  tipo: string
  estado: string
  notas: string | null
  user: AppointmentUser
  nutricionista: AppointmentNutritionist | null
}

interface Nutritionist {
  id: string
  nombre: string
  matricula: string
  especialidades: string[]
  color: string
  activo: boolean
}

interface SimpleUser {
  id: string
  name: string | null
  email: string | null
  profile: { fullName: string | null } | null
}

const TIPOS = ['CONSULTA_NUTRICIONAL', 'SEGUIMIENTO', 'ANTROPOMETRIA', 'CONSULTA_DEPORTIVA'] as const
const DURACIONES = [30, 45, 60, 90]
const ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'] as const
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"

function NutricionistaDot({ color, size = 'sm' }: { color: string; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-5 h-5 text-xs' : 'w-2 h-2'
  return <span className={`${sz} rounded-full inline-block shrink-0`} style={{ backgroundColor: color }} />
}

function NutricionistaAvatar({ nutritionist }: { nutritionist: AppointmentNutritionist | null }) {
  if (!nutritionist) return <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">?</div>
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ backgroundColor: nutritionist.color }}
      title={nutritionist.nombre}
    >
      {nutritionist.nombre.charAt(0)}
    </div>
  )
}

export function CalendarTab() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([])
  const [nutritionistsError, setNutritionistsError] = useState(false)
  const [activeNutricionistaId, setActiveNutricionistaId] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [form, setForm] = useState({
    nutricionistaId: '',
    userId: '',
    fecha: '',
    tipo: 'CONSULTA_NUTRICIONAL',
    duracion: 60,
    notas: '',
  })
  const [saving, setSaving] = useState(false)

  // Fetch nutricionistas once
  useEffect(() => {
    fetch('/api/admin/nutritionists')
      .then((r) => r.json())
      .then((data: { nutritionists: Nutritionist[] }) => setNutritionists(data.nutritionists ?? []))
      .catch(() => setNutritionistsError(true))
  }, [])

  // Fetch users once
  useEffect(() => {
    fetch('/api/admin/users?role=USER')
      .then((r) => r.json())
      .then((data: { users: SimpleUser[] }) => setUsers(data.users ?? []))
  }, [])

  const fetchAppointments = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ mes: String(month + 1), anio: String(year) })
    if (activeNutricionistaId) params.set('nutricionistaId', activeNutricionistaId)
    fetch(`/api/admin/appointments?${params}`)
      .then((r) => r.json())
      .then((data: { appointments: Appointment[] }) => setAppointments(data.appointments ?? []))
      .finally(() => setLoading(false))
  }, [month, year, activeNutricionistaId])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = new Date(year, month, 1).getDay()

  function appointmentsForDay(day: number) {
    return appointments.filter((a) => {
      const d = new Date(a.fecha)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
    setSelectedDay(null)
  }

  async function handleChangeEstado(id: string, estado: string) {
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, estado } : a))
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este turno?')) return
    const res = await fetch(`/api/admin/appointments/${id}`, { method: 'DELETE' })
    if (res.ok) setAppointments((prev) => prev.filter((a) => a.id !== id))
  }

  async function handleCreate() {
    if (!form.nutricionistaId || !form.userId || !form.fecha) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutricionistaId: form.nutricionistaId,
          userId: form.userId,
          fecha: form.fecha,
          tipo: form.tipo,
          duracion: form.duracion,
          notas: form.notas || undefined,
        }),
      })
      if (res.ok) {
        setShowModal(false)
        setForm({ nutricionistaId: '', userId: '', fecha: '', tipo: 'CONSULTA_NUTRICIONAL', duracion: 60, notas: '' })
        setUserSearch('')
        fetchAppointments()
      }
    } finally {
      setSaving(false)
    }
  }

  function openModal() {
    setShowModal(true)
    setForm({ nutricionistaId: '', userId: '', fecha: '', tipo: 'CONSULTA_NUTRICIONAL', duracion: 60, notas: '' })
    setUserSearch('')
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase()
    return (u.profile?.fullName ?? u.name ?? u.email ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
  })

  const selectedAppts = selectedDay !== null ? appointmentsForDay(selectedDay) : []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500 mt-0.5">{appointments.length} turno{appointments.length !== 1 ? 's' : ''} este mes</p>
        </div>
        <button
          onClick={openModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          + Nuevo turno
        </button>
      </div>

      {/* Nutricionista filter pills */}
      {nutritionistsError ? (
        <p className="text-xs text-red-500">No se pudieron cargar los nutricionistas.</p>
      ) : nutritionists.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveNutricionistaId(null); setSelectedDay(null) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeNutricionistaId === null
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {nutritionists.map((n) => (
            <button
              key={n.id}
              onClick={() => { setActiveNutricionistaId(n.id === activeNutricionistaId ? null : n.id); setSelectedDay(null) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeNutricionistaId === n.id
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              style={activeNutricionistaId === n.id ? { backgroundColor: n.color, borderColor: n.color } : {}}
            >
              <NutricionistaDot color={n.color} />
              {n.nombre}
            </button>
          ))}
        </div>
      ) : null}

      {/* Month nav + calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 font-medium">‹</button>
          <span className="font-semibold text-gray-900">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 font-medium">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-400">Cargando...</div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-gray-50" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayAppts = appointmentsForDay(day)
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
              const isSelected = selectedDay === day

              // Unique colors for dots (up to 3 distinct nutricionistas)
              const seenColors: string[] = []
              for (const a of dayAppts) {
                const color = a.nutricionista?.color ?? '#9ca3af'
                if (!seenColors.includes(color)) seenColors.push(color)
                if (seenColors.length === 3) break
              }
              const extraCount = dayAppts.length - seenColors.length

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[72px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${isToday ? 'bg-emerald-600 text-white' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  {dayAppts.length > 0 && (
                    <div className="flex items-center gap-0.5 flex-wrap">
                      {seenColors.map((color, ci) => (
                        <span key={ci} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      ))}
                      {extraCount > 0 && (
                        <span className="text-[9px] text-gray-400 leading-none ml-0.5">+{extraCount}</span>
                      )}
                    </div>
                  )}
                  {dayAppts.length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                      {dayAppts.length} turno{dayAppts.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected day panel */}
      {selectedDay !== null && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            {selectedDay} de {MONTHS[month]} — {selectedAppts.length} turno{selectedAppts.length !== 1 ? 's' : ''}
          </h2>
          {selectedAppts.length === 0 ? (
            <p className="text-sm text-gray-400">Sin turnos este día.</p>
          ) : (
            <div className="space-y-3">
              {selectedAppts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <NutricionistaAvatar nutritionist={a.nutricionista} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${ESTADO_COLORS[a.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.estado}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{a.user.name ?? a.user.email}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(a.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{TIPO_LABELS[a.tipo] ?? a.tipo}
                      {' · '}{a.duracion} min
                    </p>
                    {a.nutricionista && (
                      <p className="text-xs mt-0.5 font-medium" style={{ color: a.nutricionista.color }}>
                        {a.nutricionista.nombre}
                      </p>
                    )}
                    {a.notas && <p className="text-xs text-gray-400 mt-1 italic">{a.notas}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={a.estado}
                      onChange={(e) => handleChangeEstado(a.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                    >
                      {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-red-400 hover:text-red-600 transition-colors text-sm font-medium"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal nuevo turno */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nuevo turno</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* Nutricionista selector */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nutricionista</label>
                <select
                  value={form.nutricionistaId}
                  onChange={(e) => setForm((f) => ({ ...f, nutricionistaId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Seleccionar nutricionista...</option>
                  {nutritionists.map((n) => (
                    <option key={n.id} value={n.id}>{n.nombre} — {n.matricula}</option>
                  ))}
                </select>
                {form.nutricionistaId && (() => {
                  const n = nutritionists.find((x) => x.id === form.nutricionistaId)
                  return n ? (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <NutricionistaDot color={n.color} />
                      <span className="text-xs font-medium" style={{ color: n.color }}>{n.nombre}</span>
                    </div>
                  ) : null
                })()}
              </div>

              {/* Paciente search */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Paciente</label>
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setForm((f) => ({ ...f, userId: '' })) }}
                  className={inputCls}
                />
                {userSearch && !form.userId && (
                  <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    {filteredUsers.slice(0, 8).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setForm((f) => ({ ...f, userId: u.id })); setUserSearch(u.profile?.fullName ?? u.name ?? u.email ?? '') }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <span className="font-medium text-gray-900">{u.profile?.fullName ?? u.name ?? '—'}</span>
                        <span className="text-gray-400 ml-2">{u.email}</span>
                      </button>
                    ))}
                    {filteredUsers.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>}
                  </div>
                )}
                {form.userId && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Usuario seleccionado</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha y hora</label>
                <input
                  type="datetime-local"
                  value={form.fecha}
                  onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de consulta</label>
                <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className={inputCls}>
                  {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Duración</label>
                <select value={form.duracion} onChange={(e) => setForm((f) => ({ ...f, duracion: parseInt(e.target.value) }))} className={inputCls}>
                  {DURACIONES.map((d) => <option key={d} value={d}>{d} minutos</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notas (opcional)</label>
                <textarea
                  rows={2}
                  value={form.notas}
                  onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                  placeholder="Observaciones..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 justify-end">
              <button onClick={() => setShowModal(false)} className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.nutricionistaId || !form.userId || !form.fecha || saving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
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
