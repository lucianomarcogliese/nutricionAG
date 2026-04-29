"use client"

import { useEffect, useState, useCallback } from "react"

interface WeightEntry {
  id: string
  weightKg: number
  fecha: string
  notas: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) return null

  const W = 600
  const H = 200
  const PAD = { top: 16, right: 16, bottom: 40, left: 44 }

  const weights = entries.map((e) => e.weightKg)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 1

  const xStep = (W - PAD.left - PAD.right) / (entries.length - 1)

  const toX = (i: number) => PAD.left + i * xStep
  const toY = (w: number) =>
    PAD.top + (H - PAD.top - PAD.bottom) * (1 - (w - minW) / range)

  const points = entries.map((e, i) => ({ x: toX(i), y: toY(e.weightKg) }))
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ")
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x.toFixed(1)} ${H - PAD.bottom}` +
    ` L ${points[0].x.toFixed(1)} ${H - PAD.bottom} Z`

  // Y-axis ticks (3)
  const yTicks = [minW, (minW + maxW) / 2, maxW]

  // X-axis labels: show at most 6, evenly spaced
  const xLabelsCount = Math.min(entries.length, 6)
  const xLabelIndices = Array.from({ length: xLabelsCount }, (_, i) =>
    Math.round((i * (entries.length - 1)) / (xLabelsCount - 1))
  )

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y gridlines + labels */}
      {yTicks.map((tick, i) => {
        const y = toY(tick)
        return (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={y}
              x2={W - PAD.right}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#9ca3af"
            >
              {tick.toFixed(1)}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#10b981" stroke="white" strokeWidth="1.5" />
      ))}

      {/* X-axis labels */}
      {xLabelIndices.map((idx) => (
        <text
          key={idx}
          x={toX(idx)}
          y={H - PAD.bottom + 16}
          textAnchor="middle"
          fontSize="10"
          fill="#9ca3af"
        >
          {formatShortDate(entries[idx].fecha)}
        </text>
      ))}
    </svg>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PesoPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [weight, setWeight] = useState("")
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [notas, setNotas] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const fetchEntries = useCallback(() => {
    setLoading(true)
    fetch("/api/peso")
      .then((r) => r.json())
      .then((data) => {
        if (data.entries) setEntries(data.entries)
        else setError("No se pudieron cargar los registros.")
      })
      .catch(() => setError("Error de conexión."))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const w = parseFloat(weight.replace(",", "."))
    if (isNaN(w) || w <= 0) {
      setFormError("Ingresá un peso válido.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/peso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: w, fecha, notas }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error ?? "Error al guardar.")
        return
      }
      setWeight("")
      setNotas("")
      setFecha(new Date().toISOString().slice(0, 10))
      fetchEntries()
    } catch {
      setFormError("Error de conexión.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/peso/${id}`, { method: "DELETE" })
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  // Stats
  const sorted = [...entries].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  const latest = sorted[sorted.length - 1]
  const first = sorted[0]
  const diff = latest && first && latest.id !== first.id
    ? +(latest.weightKg - first.weightKg).toFixed(2)
    : null

  const recent = [...sorted].reverse().slice(0, 30)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Seguimiento de peso</h1>
        <p className="text-sm text-gray-500 mt-1">Registrá tu peso periódicamente para ver tu progreso</p>
      </div>

      {/* Stats */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peso actual</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{latest.weightKg} <span className="text-sm font-normal text-gray-400">kg</span></p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(latest.fecha)}</p>
          </div>

          {diff !== null && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Variación total</p>
              <p className={`text-2xl font-bold mt-1 ${diff < 0 ? "text-emerald-600" : diff > 0 ? "text-red-500" : "text-gray-900"}`}>
                {diff > 0 ? "+" : ""}{diff} <span className="text-sm font-normal text-gray-400">kg</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">desde {formatDate(first.fecha)}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registros</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{sorted.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">total</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {sorted.length >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Evolución</p>
          <WeightChart entries={sorted} />
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Agregar registro</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex flex-col gap-1 w-full sm:w-32">
            <label className="text-xs text-gray-500">Peso (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="72.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-40">
            <label className="text-xs text-gray-500">Fecha</label>
            <input
              type="date"
              value={fecha}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 w-full">
            <label className="text-xs text-gray-500">Notas (opcional)</label>
            <input
              type="text"
              placeholder="Ej: después de entrenar"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <label className="text-xs text-gray-500 invisible">Guardar</label>
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
        {formError && <p className="text-xs text-red-500 mt-2">{formError}</p>}
      </div>

      {/* History list */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse h-14" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          <div className="text-5xl mb-4">⚖️</div>
          <p className="text-gray-500 text-sm">Todavía no tenés registros de peso.</p>
          <p className="text-gray-400 text-xs mt-1">Usá el formulario de arriba para empezar a trackear.</p>
        </div>
      )}

      {!loading && recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Historial reciente</p>
          </div>
          <ul className="divide-y divide-gray-100">
            {recent.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-800 w-16 shrink-0">
                    {entry.weightKg} kg
                  </span>
                  <div>
                    <p className="text-sm text-gray-600">{formatDate(entry.fecha)}</p>
                    {entry.notas && <p className="text-xs text-gray-400">{entry.notas}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg shrink-0"
                  title="Eliminar"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
