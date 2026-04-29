'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Routine {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: { exercises: number }
}

interface Exercise {
  id: string
  routineId: string
  name: string
  sets: number
  reps: number
  orderIndex: number
}

export function EntrenamientosView() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Record<string, Exercise[]>>({})
  const [showNewRoutineForm, setShowNewRoutineForm] = useState(false)

  const [newRoutineName, setNewRoutineName] = useState('')
  const [newRoutineDesc, setNewRoutineDesc] = useState('')
  const [creatingRoutine, setCreatingRoutine] = useState(false)
  const [limitError, setLimitError] = useState(false)

  const [newExercise, setNewExercise] = useState<Record<string, { name: string; sets: string; reps: string }>>({})
  const [addingExercise, setAddingExercise] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/entrenamientos')
      .then((r) => r.json())
      .then((data: { routines: Routine[] }) => {
        console.log('GET /api/entrenamientos respuesta:', JSON.stringify(data))
        setRoutines(data.routines ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleToggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!exercises[id]) {
      const res = await fetch(`/api/entrenamientos/${id}/ejercicios`)
      const data = (await res.json()) as { exercises: Exercise[] }
      setExercises((prev) => ({ ...prev, [id]: data.exercises ?? [] }))
    }
  }

  async function handleCreateRoutine() {
    const name = newRoutineName.trim()
    if (!name) return
    setCreatingRoutine(true)
    setLimitError(false)
    try {
      const res = await fetch('/api/entrenamientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: newRoutineDesc || undefined }),
      })
      const data = (await res.json()) as { routine?: Routine; error?: string }
      if (res.status === 403 && data.error === 'LIMITE_RUTINAS') {
        setLimitError(true)
        setShowNewRoutineForm(false)
        return
      }
      if (res.ok && data.routine) {
        setRoutines((prev) => [{ ...data.routine!, _count: { exercises: 0 } }, ...prev])
        setShowNewRoutineForm(false)
        setNewRoutineName('')
        setNewRoutineDesc('')
      }
    } finally {
      setCreatingRoutine(false)
    }
  }

  async function handleDeleteRoutine(id: string) {
    await fetch(`/api/entrenamientos/${id}`, { method: 'DELETE' })
    setRoutines((prev) => prev.filter((r) => r.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function getExerciseForm(id: string) {
    return newExercise[id] ?? { name: '', sets: '', reps: '' }
  }

  function setExerciseField(id: string, field: 'name' | 'sets' | 'reps', value: string) {
    setNewExercise((prev) => ({
      ...prev,
      [id]: { ...getExerciseForm(id), [field]: value },
    }))
  }

  async function handleAddExercise(routineId: string) {
    const form = getExerciseForm(routineId)
    const name = form.name.trim()
    const sets = parseInt(form.sets, 10)
    const reps = parseInt(form.reps, 10)
    if (!name || !sets || !reps || sets < 1 || reps < 1) return

    setAddingExercise((prev) => ({ ...prev, [routineId]: true }))
    try {
      const orderIndex = (exercises[routineId] ?? []).length
      const res = await fetch(`/api/entrenamientos/${routineId}/ejercicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sets, reps, orderIndex }),
      })
      const data = (await res.json()) as { exercise: Exercise }
      setExercises((prev) => ({
        ...prev,
        [routineId]: [...(prev[routineId] ?? []), data.exercise],
      }))
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === routineId
            ? { ...r, _count: { exercises: r._count.exercises + 1 } }
            : r
        )
      )
      setNewExercise((prev) => ({ ...prev, [routineId]: { name: '', sets: '', reps: '' } }))
    } finally {
      setAddingExercise((prev) => ({ ...prev, [routineId]: false }))
    }
  }

  async function handleDeleteExercise(routineId: string, exerciseId: string) {
    await fetch(`/api/entrenamientos/${routineId}/ejercicios/${exerciseId}`, { method: 'DELETE' })
    setExercises((prev) => ({
      ...prev,
      [routineId]: (prev[routineId] ?? []).filter((e) => e.id !== exerciseId),
    }))
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId
          ? { ...r, _count: { exercises: Math.max(0, r._count.exercises - 1) } }
          : r
      )
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrenamientos</h1>
          <p className="text-sm text-gray-500 mt-1">Tus rutinas personalizadas</p>
        </div>
        <button
          onClick={() => setShowNewRoutineForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shrink-0 ml-4"
        >
          + Nueva rutina
        </button>
      </div>

      {/* Banner límite de plan */}
      {limitError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            Alcanzaste el límite de rutinas de tu plan. Actualizá para crear más.
          </p>
          <Link
            href="/planes"
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Ver planes
          </Link>
        </div>
      )}

      {/* Form nueva rutina */}
      {showNewRoutineForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mt-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Nueva rutina</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nombre de la rutina"
              maxLength={100}
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={newRoutineDesc}
              onChange={(e) => setNewRoutineDesc(e.target.value)}
              rows={2}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={() => {
                setShowNewRoutineForm(false)
                setNewRoutineName('')
                setNewRoutineDesc('')
              }}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateRoutine}
              disabled={!newRoutineName.trim() || creatingRoutine}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {creatingRoutine ? 'Creando...' : 'Crear rutina'}
            </button>
          </div>
        </div>
      )}

      {/* Skeletons mientras carga */}
      {loading && (
        <>
          <div className="bg-gray-100 animate-pulse rounded-2xl h-16 mt-4" />
          <div className="bg-gray-100 animate-pulse rounded-2xl h-16 mt-4" />
          <div className="bg-gray-100 animate-pulse rounded-2xl h-16 mt-4" />
        </>
      )}

      {/* Estado vacío */}
      {!loading && routines.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center mt-4">
          <div className="text-5xl mb-4">🏋️</div>
          <p className="text-gray-700 font-medium">Todavía no tenés rutinas</p>
          <p className="text-sm text-gray-500 mt-1">Creá tu primera rutina para empezar a entrenar</p>
          <button
            onClick={() => setShowNewRoutineForm(true)}
            className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
          >
            Crear primera rutina
          </button>
        </div>
      )}

      {/* Lista de rutinas */}
      {!loading &&
        routines.map((routine) => {
          const isExpanded = expandedId === routine.id
          const routineExercises = exercises[routine.id] ?? []
          const form = getExerciseForm(routine.id)

          return (
            <div key={routine.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-4">
              {/* Header de la card */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                onClick={() => handleToggleExpand(routine.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-gray-900 truncate">{routine.name}</span>
                  <span className="bg-emerald-100 text-emerald-700 text-xs rounded-full px-2.5 py-0.5 font-medium shrink-0">
                    {routine._count.exercises} {routine._count.exercises === 1 ? 'ejercicio' : 'ejercicios'}
                  </span>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteRoutine(routine.id)
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors text-sm"
                    aria-label="Eliminar rutina"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Descripción (si existe y está colapsado no se muestra, solo en expandido) */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                  {routine.description && (
                    <p className="text-sm text-gray-500 mb-4">{routine.description}</p>
                  )}

                  {/* Lista de ejercicios */}
                  {routineExercises.length === 0 ? (
                    <p className="text-sm text-gray-400 mb-4">
                      Todavía no hay ejercicios en esta rutina.
                    </p>
                  ) : (
                    <ul className="space-y-2 mb-4">
                      {routineExercises.map((ex) => (
                        <li
                          key={ex.id}
                          className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
                        >
                          <span className="text-sm text-gray-800 font-medium truncate">{ex.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
                              {ex.sets} series × {ex.reps} reps
                            </span>
                            <button
                              onClick={() => handleDeleteExercise(routine.id, ex.id)}
                              className="text-red-400 hover:text-red-600 transition-colors text-sm leading-none"
                              aria-label="Eliminar ejercicio"
                            >
                              ×
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Form agregar ejercicio */}
                  <div className="mt-4">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre del ejercicio"
                        value={form.name}
                        onChange={(e) => setExerciseField(routine.id, 'name', e.target.value)}
                        className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Series"
                        value={form.sets}
                        onChange={(e) => setExerciseField(routine.id, 'sets', e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Reps"
                        value={form.reps}
                        onChange={(e) => setExerciseField(routine.id, 'reps', e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleAddExercise(routine.id)}
                      disabled={!form.name.trim() || !form.sets || !form.reps || addingExercise[routine.id]}
                      className="mt-2 w-full border border-emerald-600 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    >
                      {addingExercise[routine.id] ? 'Agregando...' : '+ Agregar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}
