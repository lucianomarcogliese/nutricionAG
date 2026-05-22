'use client'

import { useEffect, useReducer } from 'react'
import type { PlanNutricion, Meal, FoodItem, ItemForm } from './types'

interface Props {
  userId: string
}

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"

function toNum(v: string | number | null | undefined) {
  if (!v) return 0
  return Number(v) || 0
}

type State = {
  plan: PlanNutricion | null | 'unloaded'
  loading: boolean
  newPlanNombre: string
  newPlanCalorias: string
  creatingPlan: boolean
  showNewMealForm: boolean
  newMealNombre: string
  addingMeal: boolean
  showItemForm: Record<string, boolean>
  itemForms: Record<string, ItemForm>
  addingItem: Record<string, boolean>
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_OK'; plan: PlanNutricion | null }
  | { type: 'SET_PLAN_FIELD'; field: 'newPlanNombre' | 'newPlanCalorias'; value: string }
  | { type: 'CREATING_PLAN'; creating: boolean }
  | { type: 'SET_PLAN'; plan: PlanNutricion }
  | { type: 'SHOW_MEAL_FORM'; show: boolean }
  | { type: 'SET_MEAL_NOMBRE'; value: string }
  | { type: 'ADDING_MEAL'; adding: boolean }
  | { type: 'ADD_MEAL'; meal: Meal }
  | { type: 'REMOVE_MEAL'; mealId: string }
  | { type: 'TOGGLE_ITEM_FORM'; mealId: string }
  | { type: 'SET_ITEM_FIELD'; mealId: string; field: string; value: string }
  | { type: 'ADDING_ITEM'; mealId: string; adding: boolean }
  | { type: 'ADD_ITEM'; mealId: string; item: FoodItem }
  | { type: 'REMOVE_ITEM'; mealId: string; itemId: string }

const initial: State = {
  plan: 'unloaded',
  loading: false,
  newPlanNombre: '',
  newPlanCalorias: '',
  creatingPlan: false,
  showNewMealForm: false,
  newMealNombre: '',
  addingMeal: false,
  showItemForm: {},
  itemForms: {},
  addingItem: {},
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START': return { ...state, loading: true }
    case 'FETCH_OK': return { ...state, loading: false, plan: action.plan }
    case 'SET_PLAN_FIELD': return { ...state, [action.field]: action.value }
    case 'CREATING_PLAN': return { ...state, creatingPlan: action.creating }
    case 'SET_PLAN': return { ...state, plan: action.plan, newPlanNombre: '', newPlanCalorias: '' }
    case 'SHOW_MEAL_FORM': return { ...state, showNewMealForm: action.show }
    case 'SET_MEAL_NOMBRE': return { ...state, newMealNombre: action.value }
    case 'ADDING_MEAL': return { ...state, addingMeal: action.adding }
    case 'ADD_MEAL': return {
      ...state,
      plan: state.plan && state.plan !== 'unloaded'
        ? { ...state.plan, meals: [...state.plan.meals, action.meal] }
        : state.plan,
      newMealNombre: '',
      showNewMealForm: false,
    }
    case 'REMOVE_MEAL': return {
      ...state,
      plan: state.plan && state.plan !== 'unloaded'
        ? { ...state.plan, meals: state.plan.meals.filter((m) => m.id !== action.mealId) }
        : state.plan,
    }
    case 'TOGGLE_ITEM_FORM': return {
      ...state,
      showItemForm: { ...state.showItemForm, [action.mealId]: !state.showItemForm[action.mealId] },
    }
    case 'SET_ITEM_FIELD': {
      const prev = state.itemForms[action.mealId] ?? { nombre: '', calorias: '', proteinas: '', carbos: '', grasas: '' }
      return { ...state, itemForms: { ...state.itemForms, [action.mealId]: { ...prev, [action.field]: action.value } } }
    }
    case 'ADDING_ITEM': return { ...state, addingItem: { ...state.addingItem, [action.mealId]: action.adding } }
    case 'ADD_ITEM': return {
      ...state,
      plan: state.plan && state.plan !== 'unloaded'
        ? { ...state.plan, meals: state.plan.meals.map((m) => m.id === action.mealId ? { ...m, foodItems: [...m.foodItems, action.item] } : m) }
        : state.plan,
      itemForms: { ...state.itemForms, [action.mealId]: { nombre: '', calorias: '', proteinas: '', carbos: '', grasas: '' } },
    }
    case 'REMOVE_ITEM': return {
      ...state,
      plan: state.plan && state.plan !== 'unloaded'
        ? { ...state.plan, meals: state.plan.meals.map((m) => m.id === action.mealId ? { ...m, foodItems: m.foodItems.filter((i) => i.id !== action.itemId) } : m) }
        : state.plan,
    }
  }
}

export function UserNutricionTab({ userId }: Props) {
  const [state, dispatch] = useReducer(reducer, initial)
  const { plan, loading, newPlanNombre, newPlanCalorias, creatingPlan, showNewMealForm, newMealNombre, addingMeal, showItemForm, itemForms, addingItem } = state

  useEffect(() => {
    dispatch({ type: 'FETCH_START' })
    fetch(`/api/admin/usuarios/${userId}/nutricion`)
      .then((r) => r.json())
      .then((data: { plan: PlanNutricion | null }) => dispatch({ type: 'FETCH_OK', plan: data.plan ?? null }))
      .catch(() => dispatch({ type: 'FETCH_OK', plan: null }))
  }, [userId])

  function getItemForm(mealId: string): ItemForm {
    return itemForms[mealId] ?? { nombre: '', calorias: '', proteinas: '', carbos: '', grasas: '' }
  }

  async function handleCreatePlan() {
    if (!newPlanNombre.trim()) return
    dispatch({ type: 'CREATING_PLAN', creating: true })
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/nutricion/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newPlanNombre.trim(), objetivoCalorico: newPlanCalorias || undefined }),
      })
      const data = (await res.json()) as { plan: PlanNutricion }
      if (res.ok && data.plan) {
        dispatch({ type: 'SET_PLAN', plan: { ...data.plan, meals: [] } })
      }
    } finally {
      dispatch({ type: 'CREATING_PLAN', creating: false })
    }
  }

  async function handleAddMeal() {
    if (!newMealNombre.trim() || !plan || plan === 'unloaded') return
    dispatch({ type: 'ADDING_MEAL', adding: true })
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/nutricion/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newMealNombre.trim(), orden: plan.meals.length }),
      })
      const data = (await res.json()) as { meal: Meal }
      if (res.ok && data.meal) {
        dispatch({ type: 'ADD_MEAL', meal: data.meal })
      }
    } finally {
      dispatch({ type: 'ADDING_MEAL', adding: false })
    }
  }

  async function handleDeleteMeal(mealId: string) {
    await fetch(`/api/admin/usuarios/${userId}/nutricion/meals/${mealId}`, { method: 'DELETE' })
    dispatch({ type: 'REMOVE_MEAL', mealId })
  }

  async function handleAddItem(mealId: string) {
    const f = getItemForm(mealId)
    if (!f.nombre.trim()) return
    dispatch({ type: 'ADDING_ITEM', mealId, adding: true })
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/nutricion/meals/${mealId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: f.nombre.trim(), calorias: f.calorias || undefined, proteinas: f.proteinas || undefined, carbos: f.carbos || undefined, grasas: f.grasas || undefined }),
      })
      const data = (await res.json()) as { item: FoodItem }
      if (res.ok && data.item) {
        dispatch({ type: 'ADD_ITEM', mealId, item: data.item })
      }
    } finally {
      dispatch({ type: 'ADDING_ITEM', mealId, adding: false })
    }
  }

  async function handleDeleteItem(mealId: string, itemId: string) {
    await fetch(`/api/admin/usuarios/${userId}/nutricion/meals/${mealId}/items/${itemId}`, { method: 'DELETE' })
    dispatch({ type: 'REMOVE_ITEM', mealId, itemId })
  }

  const resolvedPlan = plan !== 'unloaded' ? plan : null
  const totalCal = resolvedPlan ? resolvedPlan.meals.flatMap((m) => m.foodItems).reduce((s, i) => s + toNum(i.calories), 0) : 0

  return (
    <div className="px-5 py-5 space-y-3">
      {loading && (
        <div className="space-y-2">
          <div className="bg-gray-100 animate-pulse rounded-xl h-20" />
          <div className="bg-gray-100 animate-pulse rounded-xl h-32" />
        </div>
      )}

      {!loading && plan === 'unloaded' && null}

      {!loading && resolvedPlan === null && (
        <div className="bg-gray-50 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-gray-500">Este usuario no tiene plan nutricional</p>
          <div className="space-y-2 text-left">
            <input
              type="text"
              placeholder="Nombre del plan"
              value={newPlanNombre}
              onChange={(e) => dispatch({ type: 'SET_PLAN_FIELD', field: 'newPlanNombre', value: e.target.value })}
              className={inputCls}
            />
            <input
              type="number"
              min="0"
              placeholder="Objetivo calórico (opcional)"
              value={newPlanCalorias}
              onChange={(e) => dispatch({ type: 'SET_PLAN_FIELD', field: 'newPlanCalorias', value: e.target.value })}
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

      {!loading && resolvedPlan && (
        <>
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-800">{resolvedPlan.name}</p>
                {resolvedPlan.caloriesTarget && (
                  <p className="text-xs text-emerald-600 mt-0.5">Objetivo: {resolvedPlan.caloriesTarget} kcal</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-700">{Math.round(totalCal)}</p>
                <p className="text-xs text-emerald-600">kcal totales</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">{resolvedPlan.meals.length} comida{resolvedPlan.meals.length !== 1 ? 's' : ''}</p>
            <button
              onClick={() => dispatch({ type: 'SHOW_MEAL_FORM', show: !showNewMealForm })}
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
                onChange={(e) => dispatch({ type: 'SET_MEAL_NOMBRE', value: e.target.value })}
                className={inputCls}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { dispatch({ type: 'SHOW_MEAL_FORM', show: false }); dispatch({ type: 'SET_MEAL_NOMBRE', value: '' }) }}
                  className="border border-gray-300 text-gray-600 text-xs rounded-lg px-3 py-1.5 hover:bg-gray-100"
                >Cancelar</button>
                <button
                  onClick={handleAddMeal}
                  disabled={!newMealNombre.trim() || addingMeal}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs rounded-lg px-3 py-1.5"
                >
                  {addingMeal ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </div>
          )}

          {resolvedPlan.meals.map((meal) => {
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
                      onClick={() => dispatch({ type: 'TOGGLE_ITEM_FORM', mealId: meal.id })}
                      className="w-full border border-dashed border-gray-300 hover:border-emerald-400 hover:text-emerald-600 text-gray-400 rounded-lg py-1.5 text-xs transition-colors"
                    >
                      + Agregar alimento
                    </button>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <input type="text" placeholder="Nombre del alimento" value={iForm.nombre}
                        onChange={(e) => dispatch({ type: 'SET_ITEM_FIELD', mealId: meal.id, field: 'nombre', value: e.target.value })}
                        className={inputCls} />
                      <div className="grid grid-cols-2 gap-2">
                        {(['calorias', 'proteinas', 'carbos', 'grasas'] as const).map((field) => (
                          <input key={field} type="number" min="0"
                            placeholder={field === 'calorias' ? 'Calorías' : field === 'proteinas' ? 'Proteínas (g)' : field === 'carbos' ? 'Carbos (g)' : 'Grasas (g)'}
                            value={iForm[field]}
                            onChange={(e) => dispatch({ type: 'SET_ITEM_FIELD', mealId: meal.id, field, value: e.target.value })}
                            className={inputCls} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => dispatch({ type: 'TOGGLE_ITEM_FORM', mealId: meal.id })}
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
  )
}
