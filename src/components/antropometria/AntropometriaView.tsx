"use client"

import { useEffect, useRef, useState } from "react"
import { calcularTodo, type SexCalc, type InputMedidas, type ResultadosCalculados } from "@/lib/antropometria-calculos"

interface Antropometria {
  id: string
  fecha: string
  pesoKg: number
  tallaCm: number
  tallaSentado: number | null
  imc: number | null
  icc: number | null
  porcentajeGrasa: number | null
  masaGrasaKg: number | null
  masaMagraKg: number | null
  masaOseaKg: number | null
  masaMuscularKg: number | null
  endomorfismo: number | null
  mesomorfismo: number | null
  ectomorfismo: number | null
  diametroBiacromial: number | null
  diametroToraxTransverso: number | null
  diametroToraxAnteroposterior: number | null
  diametroBiiliocrestideo: number | null
  diametroBiepicondileoHumeral: number | null
  diametroBiepicondileoFemoral: number | null
  diametroMunieca: number | null
  perimetroCabeza: number | null
  brazoRelajado: number | null
  brazoFlexionado: number | null
  perimetroAntebrazo: number | null
  toraxMesoesternal: number | null
  cinturaMinima: number | null
  caderaMaxima: number | null
  musloSuperior: number | null
  musloMedial: number | null
  pantorrillaMaxima: number | null
  pliegueSubescapular: number | null
  pliegueTriceps: number | null
  pliegueSupraespinal: number | null
  pliegueAbdominal: number | null
  pliegueMusloMedial: number | null
  plieguePantorrilla: number | null
  notas: string | null
  nutricionista: { id: string; nombre: string; color: string } | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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
    <span className={`text-xs font-medium ${isGood ? "text-emerald-500" : "text-rose-400"}`}>
      {arrow} {sign}{d.diff}
    </span>
  )
}

function suma6(a: Antropometria): number | null {
  const vals = [a.pliegueTriceps, a.pliegueSubescapular, a.pliegueSupraespinal, a.pliegueAbdominal, a.pliegueMusloMedial, a.plieguePantorrilla]
  if (vals.some((v) => v === null)) return null
  return Math.round((vals as number[]).reduce((s, v) => s + v, 0) * 10) / 10
}

function medicionToInput(m: Antropometria, sexo: SexCalc, edad: number): InputMedidas {
  return {
    pesoKg: m.pesoKg, tallaCm: m.tallaCm, edad, sexo,
    tallaSentado: m.tallaSentado ?? undefined,
    cinturaMinima: m.cinturaMinima ?? undefined,
    caderaMaxima: m.caderaMaxima ?? undefined,
    brazoRelajado: m.brazoRelajado ?? undefined,
    brazoFlexionado: m.brazoFlexionado ?? undefined,
    perimetroAntebrazo: m.perimetroAntebrazo ?? undefined,
    toraxMesoesternal: m.toraxMesoesternal ?? undefined,
    musloSuperior: m.musloSuperior ?? undefined,
    pantorrillaMaxima: m.pantorrillaMaxima ?? undefined,
    pliegueSubescapular: m.pliegueSubescapular ?? undefined,
    pliegueTriceps: m.pliegueTriceps ?? undefined,
    pliegueSupraespinal: m.pliegueSupraespinal ?? undefined,
    pliegueAbdominal: m.pliegueAbdominal ?? undefined,
    pliegueMusloMedial: m.pliegueMusloMedial ?? undefined,
    plieguePantorrilla: m.plieguePantorrilla ?? undefined,
    diametroBiacromial: m.diametroBiacromial ?? undefined,
    diametroBiiliocrestideo: m.diametroBiiliocrestideo ?? undefined,
    diametroBiepicondileoHumeral: m.diametroBiepicondileoHumeral ?? undefined,
    diametroBiepicondileoFemoral: m.diametroBiepicondileoFemoral ?? undefined,
    diametroToraxTransverso: m.diametroToraxTransverso ?? undefined,
    diametroToraxAnteroposterior: m.diametroToraxAnteroposterior ?? undefined,
    perimetroCabeza: m.perimetroCabeza ?? undefined,
  }
}

function calcPesoEstructurado(c: ResultadosCalculados): number | null {
  const { masaAdiposaKg: a, masaMuscularKg: m, masaResidualKg: r, masaOseaKg: o, masaPielKg: p } = c
  if (a === undefined || m === undefined || r === undefined || o === undefined || p === undefined) return null
  return a + m + r + o + p
}

function calcAjustado(masa: number, pesoEstructurado: number, pesoReal: number) {
  const diff = pesoEstructurado - pesoReal
  return masa - diff * (masa / pesoEstructurado)
}

// ── Gráfico de torta ──────────────────────────────────────────────────────────

interface PieSegment { label: string; value: number; color: string }

const PIE_COLORS: Record<string, string> = {
  "Masa Adiposa":  "#8B8FD4",
  "Masa Muscular": "#8B2252",
  "Masa Residual": "#E0E0A0",
  "Masa Ósea":    "#A8D8E0",
  "Masa de Piel":  "#6B3670",
}

function BodyCompositionPie({ segments }: { segments: PieSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ label: string; pct: number; kg: number; x: number; y: number } | null>(null)

  if (total <= 0) return null
  const cx = 90, cy = 90, r = 75
  let cumAngle = -Math.PI / 2
  const paths = segments.map((seg) => {
    const angle = (seg.value / total) * 2 * Math.PI
    const start = cumAngle
    const end = cumAngle + angle
    cumAngle = end
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end)
    const midAngle = start + angle / 2
    const lr = r * 0.62
    return {
      d: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      color: seg.color,
      pct: Math.round((seg.value / total) * 100),
      label: seg.label,
      value: seg.value,
      lx: cx + lr * Math.cos(midAngle),
      ly: cy + lr * Math.sin(midAngle),
      angle,
    }
  })

  function handleMouseMove(e: React.MouseEvent, p: typeof paths[number]) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({ label: p.label, pct: p.pct, kg: p.value, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className="relative">
        <svg viewBox="0 0 180 180" className="w-44 h-44 drop-shadow-sm"
          onMouseLeave={() => setTooltip(null)}>
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2"
              style={{ cursor: "pointer", transition: "opacity 0.1s" }}
              onMouseMove={(e) => handleMouseMove(e, p)}
              onMouseEnter={(e) => { handleMouseMove(e, p) }}
            />
          ))}
          {paths.map((p, i) =>
            p.pct >= 8 ? (
              <text key={i} x={p.lx.toFixed(1)} y={p.ly.toFixed(1)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="700" fill="white"
                style={{ pointerEvents: "none" }}>
                {p.pct}%
              </text>
            ) : null
          )}
        </svg>
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 px-2.5 py-1.5 rounded-lg shadow-lg text-xs text-white"
            style={{
              background: "rgba(17,24,39,0.88)",
              left: tooltip.x + 10,
              top: tooltip.y - 36,
              whiteSpace: "nowrap",
            }}
          >
            <p className="font-semibold">{tooltip.label}</p>
            <p style={{ color: "#9ca3af" }}>{tooltip.pct}% · {tooltip.kg.toFixed(1)} kg</p>
          </div>
        )}
      </div>
      <div className="w-full space-y-1.5 text-xs">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600 flex-1">{p.label}</span>
            <span className="font-semibold text-gray-700 tabular-nums">{p.pct}%</span>
            <span className="text-gray-400 tabular-nums">{p.value.toFixed(1)} kg</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tarjeta KPI ───────────────────────────────────────────────────────────────

function KpiCard({
  label, value, unit, secondaryValue, secondaryUnit, d, goodDir, color,
}: {
  label: string; value: number | null; unit: string
  secondaryValue?: number | null; secondaryUnit?: string
  d: ReturnType<typeof delta>; goodDir: "up" | "down"; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {value !== null ? (
        <>
          <div className="flex items-baseline gap-1 flex-wrap">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-400">{unit}</p>
            {secondaryValue !== null && secondaryValue !== undefined && secondaryUnit && (
              <p className="text-sm text-gray-400">({secondaryValue}{secondaryUnit})</p>
            )}
          </div>
          <div className="mt-1 min-h-[1rem]">
            <DeltaBadge d={d} goodDir={goodDir} />
          </div>
        </>
      ) : (
        <p className="text-lg font-medium text-gray-300">—</p>
      )}
    </div>
  )
}

// ── Bloque de medición expandible ─────────────────────────────────────────────

function MedicionCard({
  item,
  prev,
  sexo,
  edad,
  defaultOpen,
}: {
  item: Antropometria
  prev: Antropometria | null
  sexo: SexCalc
  edad: number
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  const calc = calcularTodo(medicionToInput(item, sexo, edad))
  const prevCalc = prev ? calcularTodo(medicionToInput(prev, sexo, edad)) : null
  const pe = calcPesoEstructurado(calc)

  const pctMusculo = calc.masaMuscularKg !== undefined
    ? Math.round((calc.masaMuscularKg / item.pesoKg) * 1000) / 10
    : null
  const prevPctMusculo = prevCalc?.masaMuscularKg !== undefined
    ? Math.round((prevCalc.masaMuscularKg / (prev?.pesoKg ?? 1)) * 1000) / 10
    : null

  const latestSuma = suma6(item)
  const prevSuma = prev ? suma6(prev) : null

  const imcDisplay = item.imc !== null
    ? item.imc
    : Math.round(item.pesoKg / Math.pow(item.tallaCm / 100, 2) * 10) / 10

  const pieSegments: PieSegment[] = pe !== null
    ? [
        { label: "Masa Adiposa",  value: Math.max(0, calcAjustado(calc.masaAdiposaKg!,  pe, item.pesoKg)), color: PIE_COLORS["Masa Adiposa"] },
        { label: "Masa Muscular", value: Math.max(0, calcAjustado(calc.masaMuscularKg!, pe, item.pesoKg)), color: PIE_COLORS["Masa Muscular"] },
        { label: "Masa Residual", value: Math.max(0, calcAjustado(calc.masaResidualKg!, pe, item.pesoKg)), color: PIE_COLORS["Masa Residual"] },
        { label: "Masa Ósea",    value: Math.max(0, calcAjustado(calc.masaOseaKg!,     pe, item.pesoKg)), color: PIE_COLORS["Masa Ósea"] },
        { label: "Masa de Piel",  value: Math.max(0, calcAjustado(calc.masaPielKg!,     pe, item.pesoKg)), color: PIE_COLORS["Masa de Piel"] },
      ].filter((s) => s.value > 0)
    : []

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header siempre visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-gray-700 text-sm">
            {new Date(item.fecha).toLocaleDateString("es-AR")}
          </span>
          <span className="text-sm text-gray-500">
            {item.pesoKg} kg · {item.tallaCm} cm
          </span>
          {imcDisplay && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              IMC {imcDisplay}
            </span>
          )}
          {latestSuma !== null && (
            <span className="text-xs text-orange-500 font-medium">Σ6: {latestSuma} mm</span>
          )}
        </div>
        <span className="text-gray-400 ml-2 flex-shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {/* Detalle expandible */}
      {open && (
        <div className="border-t border-gray-100 px-4 pb-5 pt-4 space-y-5">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Peso" value={item.pesoKg} unit="kg"
              d={delta(item.pesoKg, prev?.pesoKg ?? null)} goodDir="down" color="text-gray-700" />
            <KpiCard label="Bícep contraído" value={item.brazoFlexionado} unit="cm"
              d={delta(item.brazoFlexionado, prev?.brazoFlexionado ?? null)} goodDir="up" color="text-blue-600" />
            <KpiCard label="Tórax mesoesternal" value={item.toraxMesoesternal} unit="cm"
              d={delta(item.toraxMesoesternal, prev?.toraxMesoesternal ?? null)} goodDir="up" color="text-indigo-600" />
            <KpiCard label="Cintura mínima" value={item.cinturaMinima} unit="cm"
              d={delta(item.cinturaMinima, prev?.cinturaMinima ?? null)} goodDir="down" color="text-orange-500" />
            <KpiCard label="Caderas máxima" value={item.caderaMaxima} unit="cm"
              d={delta(item.caderaMaxima, prev?.caderaMaxima ?? null)} goodDir="down" color="text-orange-400" />
            <KpiCard label="Kg de hueso" value={calc.masaOseaKg ?? item.masaOseaKg} unit="kg"
              d={delta(calc.masaOseaKg ?? item.masaOseaKg, prevCalc?.masaOseaKg ?? prev?.masaOseaKg ?? null)} goodDir="up" color="text-stone-500" />
            <KpiCard label="Kg de grasa" value={calc.masaAdiposaKg ?? item.masaGrasaKg} unit="kg"
              secondaryValue={calc.porcentajeGrasa ?? item.porcentajeGrasa} secondaryUnit="%"
              d={delta(calc.masaAdiposaKg ?? item.masaGrasaKg, prevCalc?.masaAdiposaKg ?? prev?.masaGrasaKg ?? null)} goodDir="down" color="text-rose-500" />
            <KpiCard label="Kg de músculo" value={calc.masaMuscularKg ?? item.masaMuscularKg} unit="kg"
              secondaryValue={pctMusculo} secondaryUnit="%"
              d={delta(calc.masaMuscularKg ?? item.masaMuscularKg, prevCalc?.masaMuscularKg ?? prev?.masaMuscularKg ?? null)} goodDir="up" color="text-blue-700" />
          </div>

          {/* Gráfico composición corporal */}
          {pieSegments.length >= 2 && (
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-4">Composición corporal</p>
              <BodyCompositionPie segments={pieSegments} />
            </div>
          )}

          {/* Suma 6 pliegues */}
          {latestSuma !== null && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <span className="text-gray-400 text-xs">Suma 6 pliegues: </span>
              <span className="font-semibold text-orange-500">{latestSuma} mm</span>
              {prevSuma !== null && (
                <DeltaBadge d={delta(latestSuma, prevSuma)} goodDir="down" />
              )}
            </div>
          )}

          {/* Notas */}
          {item.notas && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500">
              <p className="text-xs font-medium text-gray-400 mb-1">Nota del nutricionista</p>
              {item.notas}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AntropometriaView() {
  const [data, setData] = useState<Antropometria[]>([])
  const [sexo, setSexo] = useState<string | null>(null)
  const [edad, setEdad] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/antropometria")
      .then((r) => r.json())
      .then((j) => {
        setData(j.antropometrias ?? [])
        setSexo(j.sex ?? null)
        setEdad(j.age ?? null)
      })
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
        <p className="font-medium">Tu nutricionista aún no registró mediciones.</p>
      </div>
    )
  }

  const sexoCalc: SexCalc = (sexo === "MALE" || sexo === "FEMALE") ? sexo : "FEMALE"
  const edadCalc = edad ?? 25

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Mis Mediciones</h1>
        <p className="text-xs text-gray-400">{data.length} {data.length === 1 ? "registro" : "registros"}</p>
      </div>

      {data.map((item, i) => (
        <MedicionCard
          key={item.id}
          item={item}
          prev={data[i + 1] ?? null}
          sexo={sexoCalc}
          edad={edadCalc}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  )
}
