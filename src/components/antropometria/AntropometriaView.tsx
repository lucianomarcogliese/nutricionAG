"use client"

import { useEffect, useRef, useState } from "react"

interface Antropometria {
  id: string
  fecha: string
  pesoKg: number
  masaGrasaKg: number | null
  masaMuscularKg: number | null
  pliegueTriceps: number | null
  pliegueSubescapular: number | null
  pliegueSuprailiaco: number | null
  pliegueAbdominal: number | null
  pliegueMusloAnterior: number | null
  plieguePantorrilla: number | null
  notas: string | null
  nutricionista: { id: string; nombre: string; color: string } | null
}

function suma6(a: Antropometria): number | null {
  const vals = [
    a.pliegueTriceps,
    a.pliegueSubescapular,
    a.pliegueSuprailiaco,
    a.pliegueAbdominal,
    a.pliegueMusloAnterior,
    a.plieguePantorrilla,
  ]
  if (vals.some((v) => v === null)) return null
  return Math.round((vals as number[]).reduce((s, v) => s + v, 0) * 10) / 10
}

type DeltaDir = "up" | "down" | null

function delta(curr: number | null, prev: number | null): { diff: number; dir: DeltaDir } | null {
  if (curr === null || prev === null) return null
  const diff = Math.round((curr - prev) * 10) / 10
  return { diff, dir: diff > 0 ? "up" : diff < 0 ? "down" : null }
}

function DeltaBadge({ d, goodDir }: { d: ReturnType<typeof delta>; goodDir: "up" | "down" }) {
  if (!d || d.dir === null) return null
  const isGood = d.dir === goodDir
  const sign = d.diff > 0 ? "+" : ""
  const arrow = d.dir === "up" ? "↑" : "↓"
  return (
    <span className={`text-xs font-medium ml-1 ${isGood ? "text-emerald-500" : "text-rose-400"}`}>
      {arrow} {sign}{d.diff}
    </span>
  )
}

function KpiCard({
  label,
  value,
  unit,
  d,
  goodDir,
  color,
}: {
  label: string
  value: number | null
  unit: string
  d: ReturnType<typeof delta>
  goodDir: "up" | "down"
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {value !== null ? (
        <div className="flex items-baseline gap-1">
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-sm text-gray-400">{unit}</p>
          <DeltaBadge d={d} goodDir={goodDir} />
        </div>
      ) : (
        <p className="text-lg font-medium text-gray-300">—</p>
      )}
    </div>
  )
}

const W = 400
const H = 100
const PAD = 8

const SVG_H = 80       // alto de render del SVG en px
const TIP_W = 90       // ancho estimado del tooltip en px
const CIRCLE_R = 6     // radio del punto activo

interface TooltipState {
  visible: boolean
  tipX: number       // px desde la izquierda del contenedor (ya clampeado)
  tipY: number       // px desde el tope del contenedor SVG
  arrowOffset: number // px desde la izquierda del tooltip hasta el centro de la flecha
  valor: string
  fecha: string
}

function LineChart({ points, label, unit, color }: {
  points: { fecha: string; value: number }[]
  label: string
  unit: string
  color: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, tipX: 0, tipY: 0, arrowOffset: TIP_W / 2 - 5, valor: "", fecha: "",
  })

  if (points.length < 2) return null

  const vals = points.map((p) => p.value)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const range = maxV - minV || 1

  const coords = points.map((p, i) => ({
    x: PAD + (i / (points.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (p.value - minV) / range) * (H - PAD * 2),
    ...p,
  }))

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ")
  const last = coords[coords.length - 1]
  const first = coords[0]

  function showTooltip(c: (typeof coords)[number]) {
    const containerW = containerRef.current?.getBoundingClientRect().width ?? W

    // Centro del punto en px dentro del contenedor
    const centerX = (c.x / W) * containerW
    // Tooltip: centrado en el punto, pero clampeado a los bordes
    const tipX = Math.min(Math.max(centerX - TIP_W / 2, 0), containerW - TIP_W)
    // La flecha apunta al punto: offset = centro_punto - borde_izq_tooltip
    const arrowOffset = Math.min(Math.max(centerX - tipX - 5, 4), TIP_W - 14)
    // Y en px: escalar viewBox→px reales, luego subir el radio del círculo
    const tipY = c.y * (SVG_H / H) - CIRCLE_R

    setTooltip({
      visible: true,
      tipX,
      tipY,
      arrowOffset,
      valor: `${c.value} ${unit}`,
      fecha: new Date(c.fecha).toLocaleDateString("es-AR", {
        day: "2-digit", month: "2-digit", year: "numeric",
      }),
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{new Date(first.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
        <span>{new Date(last.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
      </div>

      <div
        ref={containerRef}
        className="relative"
        onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: SVG_H, display: "block" }}>
          <polyline fill="none" stroke={color} strokeWidth="2.5" points={polyline} />
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={i === coords.length - 1 ? CIRCLE_R : 4}
              fill={i === coords.length - 1 ? color : "white"}
              stroke={color}
              strokeWidth="2"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => showTooltip(c)}
              onTouchStart={(e) => { e.preventDefault(); showTooltip(c) }}
              onTouchEnd={() => setTooltip((t) => ({ ...t, visible: false }))}
            />
          ))}
        </svg>

        {tooltip.visible && (
          <div
            className="pointer-events-none absolute z-10"
            style={{
              left: tooltip.tipX,
              top: tooltip.tipY,
              transform: "translateY(-100%)",
              width: TIP_W,
            }}
          >
            <div
              className="text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg"
              style={{ background: "rgba(17,24,39,0.9)" }}
            >
              <p className="font-semibold truncate">{tooltip.valor}</p>
              <p style={{ color: "#9ca3af" }}>{tooltip.fecha}</p>
            </div>
            {/* flecha apuntando al punto exacto */}
            <div
              style={{
                marginLeft: tooltip.arrowOffset,
                width: 0, height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid rgba(17,24,39,0.9)",
              }}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{first.value} {unit}</span>
        <span className="font-medium" style={{ color }}>{last.value} {unit}</span>
      </div>
    </div>
  )
}

export default function AntropometriaView() {
  const [data, setData] = useState<Antropometria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/antropometria")
      .then((r) => r.json())
      .then((j) => setData(j.antropometrias ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="text-5xl mb-4">📏</div>
        <p className="font-medium">No tenés mediciones registradas todavía.</p>
        <p className="text-sm mt-1">Tu nutricionista cargará los datos en tu próxima consulta.</p>
      </div>
    )
  }

  // data está ordenado desc (más reciente primero)
  const latest = data[0]
  const prev = data[1] ?? null

  const latestSuma = suma6(latest)
  const prevSuma = prev ? suma6(prev) : null

  // Puntos para gráficos (orden cronológico asc)
  const asc = [...data].reverse()
  const puntosPliegues = asc.map((d) => ({ fecha: d.fecha, value: suma6(d) })).filter((p) => p.value !== null) as { fecha: string; value: number }[]
  const puntosMusculo = asc.map((d) => ({ fecha: d.fecha, value: d.masaMuscularKg })).filter((p) => p.value !== null) as { fecha: string; value: number }[]
  const puntosPeso = asc.map((d) => ({ fecha: d.fecha, value: d.pesoKg }))
  const puntosGrasa = asc.map((d) => ({ fecha: d.fecha, value: d.masaGrasaKg })).filter((p) => p.value !== null) as { fecha: string; value: number }[]

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mis Mediciones</h1>
        <p className="text-xs text-gray-400">
          Última: {new Date(latest.fecha).toLocaleDateString("es-AR")}
        </p>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Suma 6 pliegues"
          value={latestSuma}
          unit="mm"
          d={delta(latestSuma, prevSuma)}
          goodDir="down"
          color="text-orange-500"
        />
        <KpiCard
          label="Masa muscular"
          value={latest.masaMuscularKg}
          unit="kg"
          d={delta(latest.masaMuscularKg, prev?.masaMuscularKg ?? null)}
          goodDir="up"
          color="text-blue-600"
        />
        <KpiCard
          label="Peso"
          value={latest.pesoKg}
          unit="kg"
          d={delta(latest.pesoKg, prev?.pesoKg ?? null)}
          goodDir="down"
          color="text-gray-700"
        />
        <KpiCard
          label="Tejido adiposo"
          value={latest.masaGrasaKg}
          unit="kg"
          d={delta(latest.masaGrasaKg, prev?.masaGrasaKg ?? null)}
          goodDir="down"
          color="text-rose-500"
        />
      </div>

      {/* Gráficos de evolución */}
      {data.length >= 2 && (
        <div className="space-y-3">
          <LineChart points={puntosPliegues} label="Suma 6 pliegues" unit="mm" color="#f97316" />
          <LineChart points={puntosMusculo} label="Masa muscular" unit="kg" color="#2563eb" />
          <LineChart points={puntosPeso} label="Peso" unit="kg" color="#374151" />
          <LineChart points={puntosGrasa} label="Tejido adiposo" unit="kg" color="#f43f5e" />
        </div>
      )}

      {/* Nota de la última medición */}
      {latest.notas && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500">
          <p className="text-xs font-medium text-gray-400 mb-1">Nota del nutricionista</p>
          {latest.notas}
        </div>
      )}
    </div>
  )
}
