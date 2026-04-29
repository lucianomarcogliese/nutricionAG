'use client'

import { useState, useEffect } from 'react'
import { GOAL_LABELS, ACTIVITY_LABELS } from '@/lib/admin-translations'

interface Stats {
  totalUsuarios: number
  usuariosConPerfil: number
  turnosPendientes: number
  turnosEsteMes: number
  objetivosMasComunes: { goal: string | null; count: number }[]
  actividadMasComun: { activityLevel: string | null; count: number }[]
}

function BarChart({ data, labelMap, color }: {
  data: { key: string | null; count: number }[]
  labelMap: Record<string, string>
  color: string
}) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700">{item.key ? (labelMap[item.key] ?? item.key) : '—'}</span>
            <span className="text-sm font-semibold text-gray-900">{item.count}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${color}`}
              style={{ width: `${Math.round((item.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-sm text-gray-400">Sin datos aún</p>
      )}
    </div>
  )
}

export function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-100 animate-pulse rounded-2xl h-48" />
          <div className="bg-gray-100 animate-pulse rounded-2xl h-48" />
        </div>
      </div>
    )
  }

  if (!stats) return <p className="text-sm text-red-500">Error al cargar estadísticas.</p>

  const cards = [
    { label: 'Total usuarios', value: stats.totalUsuarios, icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Perfiles completos', value: stats.usuariosConPerfil, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Turnos pendientes', value: stats.turnosPendientes, icon: '⏳', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Turnos este mes', value: stats.turnosEsteMes, icon: '📅', color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general del sistema</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center text-xl mb-3`}>
              {c.icon}
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Objetivos más comunes</h2>
          <BarChart
            data={stats.objetivosMasComunes.map((g) => ({ key: g.goal, count: g.count }))}
            labelMap={GOAL_LABELS}
            color="bg-emerald-500"
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Niveles de actividad</h2>
          <BarChart
            data={stats.actividadMasComun.map((g) => ({ key: g.activityLevel, count: g.count }))}
            labelMap={ACTIVITY_LABELS}
            color="bg-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
