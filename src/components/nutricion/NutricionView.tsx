'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FoodItem {
  id: string
  mealId: string
  name: string
  calories: string | number | null
  proteinG: string | number | null
  carbsG: string | number | null
  fatG: string | number | null
}

interface Meal {
  id: string
  planId: string
  name: string
  orderIndex: number
  foodItems: FoodItem[]
}

interface Plan {
  id: string
  name: string
  caloriesTarget: number | null
  meals: Meal[]
}

interface ItemForm {
  name: string
  calories: string
  proteinG: string
  carbsG: string
  fatG: string
}

const DEFAULT_ITEM_FORM: ItemForm = { name: '', calories: '', proteinG: '', carbsG: '', fatG: '' }
const MEAL_PRESETS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack']

function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0
  return Number(v) || 0
}

function fmt(v: number): string {
  return v % 1 === 0 ? String(v) : v.toFixed(1)
}

export function NutricionView() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanCalories, setNewPlanCalories] = useState('')
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [limitError, setLimitError] = useState(false)

  const [newMealName, setNewMealName] = useState('')
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [addingMeal, setAddingMeal] = useState(false)

  const [showItemForm, setShowItemForm] = useState<Record<string, boolean>>({})
  const [itemForms, setItemForms] = useState<Record<string, ItemForm>>({})
  const [addingItem, setAddingItem] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/nutricion/plan')
      .then((r) => r.json())
      .then((data: { plan: Plan | null }) => setPlan(data.plan ?? null))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreatePlan() {
    const name = newPlanName.trim()
    if (!name) return
    setCreatingPlan(true)
    setLimitError(false)
    try {
      const res = await fetch('/api/nutricion/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, caloriesTarget: newPlanCalories || undefined }),
      })
      const data = (await res.json()) as { plan?: Plan; error?: string }
      if (res.status === 403 && data.error === 'LIMITE_PLANES') {
        setLimitError(true)
        return
      }
      if (res.ok && data.plan) {
        setPlan({ ...data.plan, meals: data.plan.meals ?? [] })
        setNewPlanName('')
        setNewPlanCalories('')
      }
    } finally {
      setCreatingPlan(false)
    }
  }

  async function handleAddMeal() {
    const name = newMealName.trim()
    if (!name || !plan) return
    setAddingMeal(true)
    try {
      const orderIndex = plan.meals.length
      const res = await fetch('/api/nutricion/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, orderIndex }),
      })
      const data = (await res.json()) as { meal: Meal }
      if (res.ok && data.meal) {
        setPlan((prev) => prev ? { ...prev, meals: [...prev.meals, data.meal] } : prev)
        setNewMealName('')
        setShowAddMeal(false)
      }
    } finally {
      setAddingMeal(false)
    }
  }

  async function handleDeleteMeal(mealId: string) {
    await fetch(`/api/nutricion/meals/${mealId}`, { method: 'DELETE' })
    setPlan((prev) =>
      prev ? { ...prev, meals: prev.meals.filter((m) => m.id !== mealId) } : prev
    )
  }

  function getItemForm(mealId: string): ItemForm {
    return itemForms[mealId] ?? DEFAULT_ITEM_FORM
  }

  function setItemField(mealId: string, field: keyof ItemForm, value: string) {
    setItemForms((prev) => ({
      ...prev,
      [mealId]: { ...getItemForm(mealId), [field]: value },
    }))
  }

  async function handleAddItem(mealId: string) {
    const form = getItemForm(mealId)
    const name = form.name.trim()
    if (!name) return
    setAddingItem((prev) => ({ ...prev, [mealId]: true }))
    try {
      const res = await fetch(`/api/nutricion/meals/${mealId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          calories: form.calories || undefined,
          proteinG: form.proteinG || undefined,
          carbsG: form.carbsG || undefined,
          fatG: form.fatG || undefined,
        }),
      })
      const data = (await res.json()) as { item: FoodItem }
      if (res.ok && data.item) {
        setPlan((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            meals: prev.meals.map((m) =>
              m.id === mealId ? { ...m, foodItems: [...m.foodItems, data.item] } : m
            ),
          }
        })
        setItemForms((prev) => ({ ...prev, [mealId]: DEFAULT_ITEM_FORM }))
      }
    } finally {
      setAddingItem((prev) => ({ ...prev, [mealId]: false }))
    }
  }

  async function handleDeleteItem(mealId: string, itemId: string) {
    await fetch(`/api/nutricion/meals/${mealId}/items/${itemId}`, { method: 'DELETE' })
    setPlan((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        meals: prev.meals.map((m) =>
          m.id === mealId ? { ...m, foodItems: m.foodItems.filter((i) => i.id !== itemId) } : m
        ),
      }
    })
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        <div className="bg-gray-100 animate-pulse rounded-2xl h-24 mb-4" />
        <div className="bg-gray-100 animate-pulse rounded-2xl h-48 mb-4" />
        <div className="bg-gray-100 animate-pulse rounded-2xl h-48" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrición</h1>
          <p className="text-sm text-gray-500 mt-1">Tu plan nutricional personalizado</p>
        </div>

        {limitError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-8 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800">
              Alcanzaste el límite de planes de tu plan gratuito. Actualizá para crear más planes.
            </p>
            <Link
              href="/planes"
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Ver planes
            </Link>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center mt-8">
          <div className="text-5xl mb-4">🥗</div>
          <p className="text-gray-700 font-medium text-lg">Todavía no tenés un plan</p>
          <p className="text-sm text-gray-500 mt-1 mb-8">Creá tu primer plan nutricional para empezar a registrar tus comidas</p>

          <div className="max-w-sm mx-auto space-y-3 text-left">
            <input
              type="text"
              placeholder="Nombre del plan (ej: Plan verano)"
              maxLength={100}
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
            />
            <input
              type="number"
              min="0"
              max="10000"
              placeholder="Objetivo calórico diario (opcional)"
              value={newPlanCalories}
              onChange={(e) => setNewPlanCalories(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
            />
            <button
              onClick={handleCreatePlan}
              disabled={!newPlanName.trim() || creatingPlan}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {creatingPlan ? 'Creando...' : 'Crear plan'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const allItems = plan.meals.flatMap((m) => m.foodItems)
  const totalCalories = allItems.reduce((s, i) => s + toNum(i.calories), 0)
  const totalProtein = allItems.reduce((s, i) => s + toNum(i.proteinG), 0)
  const totalCarbs = allItems.reduce((s, i) => s + toNum(i.carbsG), 0)
  const totalFat = allItems.reduce((s, i) => s + toNum(i.fatG), 0)
  const target = plan.caloriesTarget ?? 0
  const progress = target > 0 ? Math.min(100, Math.round((totalCalories / target) * 100)) : 0

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrición</h1>
          <p className="text-sm text-gray-500 mt-1">{plan.name}</p>
        </div>
        <button
          onClick={() => setShowAddMeal((v) => !v)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shrink-0 ml-4"
        >
          + Agregar comida
        </button>
      </div>

      {/* Form nueva comida */}
      {showAddMeal && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mt-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Nueva comida</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {MEAL_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setNewMealName(preset)}
                className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                  newMealName === preset
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="O escribí el nombre"
            value={newMealName}
            onChange={(e) => setNewMealName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
          />
          <div className="flex gap-2 mt-3 justify-end">
            <button
              onClick={() => { setShowAddMeal(false); setNewMealName('') }}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddMeal}
              disabled={!newMealName.trim() || addingMeal}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {addingMeal ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>
      )}

      {/* Barra de progreso calórico */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Calorías del día</span>
          <span className="text-sm font-semibold text-gray-900">
            {fmt(totalCalories)} {target > 0 ? `/ ${target} kcal` : 'kcal'}
          </span>
        </div>
        {target > 0 && (
          <>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  progress >= 100 ? 'bg-red-500' : progress >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{progress}% del objetivo diario</p>
          </>
        )}

        {/* Macros totales */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5">Proteínas</p>
            <p className="text-sm font-semibold text-blue-600">{fmt(totalProtein)}g</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5">Carbos</p>
            <p className="text-sm font-semibold text-amber-600">{fmt(totalCarbs)}g</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5">Grasas</p>
            <p className="text-sm font-semibold text-red-500">{fmt(totalFat)}g</p>
          </div>
        </div>
      </div>

      {/* Estado vacío de comidas */}
      {plan.meals.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center mt-4">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-gray-500 text-sm">
            Todavía no tenés comidas en este plan.{' '}
            <button onClick={() => setShowAddMeal(true)} className="text-emerald-600 font-medium hover:underline">
              Agregar la primera
            </button>
          </p>
        </div>
      )}

      {/* Cards de comidas */}
      {plan.meals.map((meal) => {
        const mealCalories = meal.foodItems.reduce((s, i) => s + toNum(i.calories), 0)
        const form = getItemForm(meal.id)
        const isShowingForm = showItemForm[meal.id] ?? false

        return (
          <div key={meal.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-4">
            {/* Header meal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-semibold text-gray-900">{meal.name}</span>
                {mealCalories > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs rounded-full px-2.5 py-0.5 font-medium shrink-0">
                    {fmt(mealCalories)} kcal
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDeleteMeal(meal.id)}
                className="text-red-400 hover:text-red-600 transition-colors text-sm shrink-0 ml-3"
              >
                Eliminar
              </button>
            </div>

            <div className="px-5 pb-5 pt-4">
              {/* Lista de alimentos */}
              {meal.foodItems.length === 0 ? (
                <p className="text-sm text-gray-400 mb-4">Todavía no hay alimentos en esta comida.</p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {meal.foodItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {toNum(item.calories) > 0 && (
                            <span className="text-xs text-gray-500">{fmt(toNum(item.calories))} kcal</span>
                          )}
                          {toNum(item.proteinG) > 0 && (
                            <span className="text-xs text-blue-500">P: {fmt(toNum(item.proteinG))}g</span>
                          )}
                          {toNum(item.carbsG) > 0 && (
                            <span className="text-xs text-amber-500">C: {fmt(toNum(item.carbsG))}g</span>
                          )}
                          {toNum(item.fatG) > 0 && (
                            <span className="text-xs text-red-400">G: {fmt(toNum(item.fatG))}g</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(meal.id, item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none shrink-0 mt-0.5"
                        aria-label="Eliminar alimento"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Toggle form agregar */}
              {!isShowingForm ? (
                <button
                  onClick={() => setShowItemForm((prev) => ({ ...prev, [meal.id]: true }))}
                  className="w-full border border-dashed border-gray-300 hover:border-emerald-400 hover:text-emerald-600 text-gray-400 rounded-lg px-4 py-2 text-sm transition-colors"
                >
                  + Agregar alimento
                </button>
              ) : (
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    placeholder="Nombre del alimento"
                    value={form.name}
                    onChange={(e) => setItemField(meal.id, 'name', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      placeholder="Calorías"
                      value={form.calories}
                      onChange={(e) => setItemField(meal.id, 'calories', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Proteínas (g)"
                      value={form.proteinG}
                      onChange={(e) => setItemField(meal.id, 'proteinG', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Carbos (g)"
                      value={form.carbsG}
                      onChange={(e) => setItemField(meal.id, 'carbsG', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Grasas (g)"
                      value={form.fatG}
                      onChange={(e) => setItemField(meal.id, 'fatG', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowItemForm((prev) => ({ ...prev, [meal.id]: false }))}
                      className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAddItem(meal.id)}
                      disabled={!form.name.trim() || addingItem[meal.id]}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    >
                      {addingItem[meal.id] ? 'Agregando...' : 'Agregar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
