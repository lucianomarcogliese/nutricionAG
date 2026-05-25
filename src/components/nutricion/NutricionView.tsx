'use client'

import { useEffect, useState } from 'react'
import {
  Sunrise, Sun, Moon, Zap, Flame, Utensils, Apple,
  Leaf, MessageCircle, Info, CheckCircle2, Pill, ChevronDown
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type ObjetivoPlan = 'DEFICIT_CALORICO' | 'GANANCIA_MUSCULAR' | 'MANTENIMIENTO' | 'VEGETARIANO' | 'SIN_TACC' | 'PERSONALIZADO'

const OBJETIVO_LABELS: Record<ObjetivoPlan, string> = {
  DEFICIT_CALORICO: 'Déficit calórico',
  GANANCIA_MUSCULAR: 'Ganancia muscular',
  MANTENIMIENTO: 'Mantenimiento',
  VEGETARIANO: 'Vegetariano',
  SIN_TACC: 'Sin TACC',
  PERSONALIZADO: 'Personalizado',
}

const OBJETIVO_BADGE: Record<ObjetivoPlan, string> = {
  DEFICIT_CALORICO: 'bg-orange-100 text-orange-700',
  GANANCIA_MUSCULAR: 'bg-blue-100 text-blue-700',
  MANTENIMIENTO: 'bg-sky-100 text-sky-700',
  VEGETARIANO: 'bg-green-100 text-green-700',
  SIN_TACC: 'bg-amber-100 text-amber-700',
  PERSONALIZADO: 'bg-gray-100 text-gray-600',
}

interface PlanOpcion { id: string; texto: string; orden: number }
interface PlanGrupo { id: string; nombre: string; orden: number; opciones: PlanOpcion[] }
interface PlanComida { id: string; nombre: string; orden: number; nota: string | null; ideasMenu: string | null; grupos: PlanGrupo[] }
interface PlanNutricional {
  id: string; nombre: string; objetivo: ObjetivoPlan
  notaNutricionista: string | null; recomendaciones: string | null; suplementos: string | null
  comidas: PlanComida[]
}

function getMealIcon(nombre: string): LucideIcon {
  const n = nombre.toLowerCase()
  if (n.includes('desayuno')) return Sunrise
  if (n.includes('colación') || n.includes('colacion') || n.includes('merienda') || n.includes('snack')) return Apple
  if (n.includes('almuerzo')) return Sun
  if (n.includes('cena')) return Moon
  if (n.includes('post')) return Zap
  if (n.includes('pre')) return Flame
  return Utensils
}

type GrupoTheme = { card: string; label: string }

function getGrupoTheme(nombre: string): GrupoTheme {
  const n = nombre.toLowerCase()
  if (/hidrato|carbohidrato|cereal|pan|arroz|pasta|fécula|farinaceo/.test(n))
    return { card: 'bg-amber-50 border border-amber-200', label: 'bg-amber-100 text-amber-700' }
  if (/proteína|proteina|carne|lácteo|lacteo|huevo|pollo|pescado|legumbre/.test(n))
    return { card: 'bg-blue-50 border border-blue-200', label: 'bg-blue-100 text-blue-700' }
  if (/fruta|vegetal|verdura|ensalada/.test(n))
    return { card: 'bg-emerald-50 border border-emerald-200', label: 'bg-emerald-100 text-emerald-700' }
  if (/grasa|aceite|fruto seco|palta|aguacate|maní|nuez/.test(n))
    return { card: 'bg-orange-50 border border-orange-200', label: 'bg-orange-100 text-orange-700' }
  return { card: 'bg-gray-50 border border-gray-200', label: 'bg-gray-100 text-gray-600' }
}

export function NutricionView() {
  const [plan, setPlan] = useState<PlanNutricional | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedComidas, setExpandedComidas] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/nutricion/mi-plan')
      .then((r) => r.json())
      .then((data: { plan: PlanNutricional | null }) => {
        setPlan(data.plan ?? null)
        if (data.plan?.comidas?.[0]) {
          setExpandedComidas({ [data.plan.comidas[0].id]: true })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-3">
        <div className="bg-gray-100 animate-pulse rounded-2xl h-28" />
        <div className="bg-gray-100 animate-pulse rounded-2xl h-16" />
        <div className="bg-gray-100 animate-pulse rounded-2xl h-16" />
        <div className="bg-gray-100 animate-pulse rounded-2xl h-16" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 text-center">
        <Leaf className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <h1 className="text-base font-semibold text-gray-800 mb-1">Sin plan asignado</h1>
        <p className="text-sm text-gray-500">Tu nutricionista aún no asignó un plan. Podés consultarle por mensajes.</p>
      </div>
    )
  }

  const toggleComida = (id: string) =>
    setExpandedComidas((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-3">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-1">Tu plan nutricional</p>
            <h1 className="text-xl font-bold text-gray-900 leading-snug truncate">{plan.nombre}</h1>
          </div>
          <span className={`text-xs font-semibold rounded-full px-3 py-1.5 shrink-0 mt-0.5 ${OBJETIVO_BADGE[plan.objetivo]}`}>
            {OBJETIVO_LABELS[plan.objetivo]}
          </span>
        </div>

        {plan.notaNutricionista && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex gap-3 items-start">
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-0.5">Nota de tu nutricionista</p>
              <p className="text-sm text-emerald-900 leading-relaxed">{plan.notaNutricionista}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Comidas ── */}
      {plan.comidas.map((comida) => {
        const isOpen = !!expandedComidas[comida.id]
        const MealIcon = getMealIcon(comida.nombre)
        const gruposConOpciones = comida.grupos.filter((g) => g.opciones.length > 0)

        return (
          <div key={comida.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/70 transition-colors"
              onClick={() => toggleComida(comida.id)}
            >
              <MealIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-semibold text-gray-900 flex-1 text-sm">{comida.nombre}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">

                {/* Nota de la comida */}
                {comida.nota && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs font-medium text-amber-800 tracking-wide">{comida.nota}</p>
                  </div>
                )}

                {/* Grupos: 1-col mobile → 2-col sm+ */}
                {gruposConOpciones.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {gruposConOpciones.map((grupo) => {
                      const theme = getGrupoTheme(grupo.nombre)
                      return (
                        <div key={grupo.id} className={`rounded-xl p-4 ${theme.card}`}>
                          <span className={`inline-block text-[11px] font-medium rounded-full px-2.5 py-0.5 mb-3 ${theme.label}`}>
                            {grupo.nombre}
                          </span>
                          <div>
                            {grupo.opciones.map((op, i) => (
                              <div key={op.id}>
                                <p className="text-sm text-gray-800 leading-relaxed">{op.texto}</p>
                                {i < grupo.opciones.length - 1 && (
                                  <div className="flex items-center gap-2 my-2">
                                    <div className="flex-1 h-px bg-gray-300/50" />
                                    <span className="text-[11px] text-gray-400 font-medium">ó</span>
                                    <div className="flex-1 h-px bg-gray-300/50" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Ideas de menú */}
                {comida.ideasMenu && (
                  <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <Utensils className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Ideas de menú</p>
                      <p className="text-sm text-gray-600 italic whitespace-pre-wrap leading-relaxed">{comida.ideasMenu}</p>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )
      })}

      {/* ── Recomendaciones ── */}
      {plan.recomendaciones && (
        <div className="flex gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-emerald-700 mb-2">Recomendaciones</p>
            <p className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">{plan.recomendaciones}</p>
          </div>
        </div>
      )}

      {/* ── Suplementos ── */}
      {plan.suplementos && (
        <div className="flex gap-3 bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-4">
          <Pill className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Suplementos</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{plan.suplementos}</p>
          </div>
        </div>
      )}

    </div>
  )
}
