'use client'

import { useEffect, useReducer } from 'react'
import type { Rutina, Ejercicio } from './types'

interface Props {
  userId: string
}

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"

type EjForm = { nombre: string; sets: string; reps: string }

type State = {
  rutinas: Rutina[]
  loading: boolean
  expanded: string | null
  showNewForm: boolean
  newName: string
  newDesc: string
  creating: boolean
  ejForms: Record<string, EjForm>
  addingEj: Record<string, boolean>
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_OK'; rutinas: Rutina[] }
  | { type: 'TOGGLE_EXPANDED'; id: string }
  | { type: 'SHOW_NEW_FORM'; show: boolean }
  | { type: 'SET_FIELD'; field: 'newName' | 'newDesc'; value: string }
  | { type: 'CREATING'; creating: boolean }
  | { type: 'RESET_NEW_FORM' }
  | { type: 'SET_EJ_FIELD'; rutinaId: string; field: string; value: string }
  | { type: 'SET_ADDING_EJ'; rutinaId: string; adding: boolean }
  | { type: 'ADD_RUTINA'; rutina: Rutina }
  | { type: 'REMOVE_RUTINA'; id: string }
  | { type: 'ADD_EJERCICIO'; rutinaId: string; ejercicio: Ejercicio }
  | { type: 'REMOVE_EJERCICIO'; rutinaId: string; ejercicioId: string }

const initial: State = {
  rutinas: [],
  loading: false,
  expanded: null,
  showNewForm: false,
  newName: '',
  newDesc: '',
  creating: false,
  ejForms: {},
  addingEj: {},
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START': return { ...state, loading: true }
    case 'FETCH_OK': return { ...state, loading: false, rutinas: action.rutinas }
    case 'TOGGLE_EXPANDED': return { ...state, expanded: state.expanded === action.id ? null : action.id }
    case 'SHOW_NEW_FORM': return { ...state, showNewForm: action.show }
    case 'SET_FIELD': return { ...state, [action.field]: action.value }
    case 'CREATING': return { ...state, creating: action.creating }
    case 'RESET_NEW_FORM': return { ...state, showNewForm: false, newName: '', newDesc: '' }
    case 'SET_EJ_FIELD': {
      const prev = state.ejForms[action.rutinaId] ?? { nombre: '', sets: '', reps: '' }
      return { ...state, ejForms: { ...state.ejForms, [action.rutinaId]: { ...prev, [action.field]: action.value } } }
    }
    case 'SET_ADDING_EJ': return { ...state, addingEj: { ...state.addingEj, [action.rutinaId]: action.adding } }
    case 'ADD_RUTINA': return { ...state, rutinas: [action.rutina, ...state.rutinas] }
    case 'REMOVE_RUTINA': return {
      ...state,
      rutinas: state.rutinas.filter((r) => r.id !== action.id),
      expanded: state.expanded === action.id ? null : state.expanded,
    }
    case 'ADD_EJERCICIO': return {
      ...state,
      rutinas: state.rutinas.map((r) =>
        r.id === action.rutinaId ? { ...r, exercises: [...r.exercises, action.ejercicio] } : r
      ),
      ejForms: { ...state.ejForms, [action.rutinaId]: { nombre: '', sets: '', reps: '' } },
    }
    case 'REMOVE_EJERCICIO': return {
      ...state,
      rutinas: state.rutinas.map((r) =>
        r.id === action.rutinaId ? { ...r, exercises: r.exercises.filter((e) => e.id !== action.ejercicioId) } : r
      ),
    }
  }
}

export function UserRutinasTab({ userId }: Props) {
  const [state, dispatch] = useReducer(reducer, initial)
  const { rutinas, loading, expanded, showNewForm, newName, newDesc, creating, ejForms, addingEj } = state

  useEffect(() => {
    dispatch({ type: 'FETCH_START' })
    fetch(`/api/admin/usuarios/${userId}/rutinas`)
      .then((r) => r.json())
      .then((data: { rutinas: Rutina[] }) => dispatch({ type: 'FETCH_OK', rutinas: data.rutinas ?? [] }))
      .catch(() => dispatch({ type: 'FETCH_OK', rutinas: [] }))
  }, [userId])

  function getEjForm(rutinaId: string): EjForm {
    return ejForms[rutinaId] ?? { nombre: '', sets: '', reps: '' }
  }

  async function handleCreateRutina() {
    if (!newName.trim()) return
    dispatch({ type: 'CREATING', creating: true })
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/rutinas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newName.trim(), descripcion: newDesc || undefined }),
      })
      const data = (await res.json()) as { rutina: Rutina }
      if (res.ok && data.rutina) {
        dispatch({ type: 'ADD_RUTINA', rutina: data.rutina })
        dispatch({ type: 'RESET_NEW_FORM' })
      }
    } finally {
      dispatch({ type: 'CREATING', creating: false })
    }
  }

  async function handleDeleteRutina(rutinaId: string) {
    await fetch(`/api/admin/usuarios/${userId}/rutinas/${rutinaId}`, { method: 'DELETE' })
    dispatch({ type: 'REMOVE_RUTINA', id: rutinaId })
  }

  async function handleAddEjercicio(rutinaId: string) {
    const f = getEjForm(rutinaId)
    if (!f.nombre.trim() || !f.sets || !f.reps) return
    dispatch({ type: 'SET_ADDING_EJ', rutinaId, adding: true })
    try {
      const orden = (rutinas.find((r) => r.id === rutinaId)?.exercises.length) ?? 0
      const res = await fetch(`/api/admin/usuarios/${userId}/rutinas/${rutinaId}/ejercicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: f.nombre.trim(), sets: parseInt(f.sets), reps: parseInt(f.reps), orden }),
      })
      const data = (await res.json()) as { ejercicio: Ejercicio }
      if (res.ok && data.ejercicio) {
        dispatch({ type: 'ADD_EJERCICIO', rutinaId, ejercicio: data.ejercicio })
      }
    } finally {
      dispatch({ type: 'SET_ADDING_EJ', rutinaId, adding: false })
    }
  }

  async function handleDeleteEjercicio(rutinaId: string, ejercicioId: string) {
    await fetch(`/api/admin/usuarios/${userId}/rutinas/${rutinaId}/ejercicios/${ejercicioId}`, { method: 'DELETE' })
    dispatch({ type: 'REMOVE_EJERCICIO', rutinaId, ejercicioId })
  }

  return (
    <div className="px-5 py-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">{rutinas.length} rutina{rutinas.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => dispatch({ type: 'SHOW_NEW_FORM', show: !showNewForm })}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
        >
          + Nueva rutina
        </button>
      </div>

      {showNewForm && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <input
            type="text"
            placeholder="Nombre de la rutina"
            value={newName}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'newName', value: e.target.value })}
            className={inputCls}
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={newDesc}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'newDesc', value: e.target.value })}
            className={inputCls}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => dispatch({ type: 'RESET_NEW_FORM' })}
              className="border border-gray-300 text-gray-600 text-xs rounded-lg px-3 py-1.5 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateRutina}
              disabled={!newName.trim() || creating}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs rounded-lg px-3 py-1.5 transition-colors"
            >
              {creating ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-12" />)}
        </div>
      )}

      {!loading && rutinas.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-400">Sin rutinas aún</div>
      )}

      {rutinas.map((rutina) => {
        const isExpanded = expanded === rutina.id
        const ejForm = getEjForm(rutina.id)
        return (
          <div key={rutina.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => dispatch({ type: 'TOGGLE_EXPANDED', id: rutina.id })}
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

                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    placeholder="Nombre del ejercicio"
                    value={ejForm.nombre}
                    onChange={(e) => dispatch({ type: 'SET_EJ_FIELD', rutinaId: rutina.id, field: 'nombre', value: e.target.value })}
                    className={inputCls}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number" min="1" placeholder="Series"
                      value={ejForm.sets}
                      onChange={(e) => dispatch({ type: 'SET_EJ_FIELD', rutinaId: rutina.id, field: 'sets', value: e.target.value })}
                      className={inputCls}
                    />
                    <input
                      type="number" min="1" placeholder="Reps"
                      value={ejForm.reps}
                      onChange={(e) => dispatch({ type: 'SET_EJ_FIELD', rutinaId: rutina.id, field: 'reps', value: e.target.value })}
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
  )
}
