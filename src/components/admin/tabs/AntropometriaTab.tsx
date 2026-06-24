"use client"

import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { calcularTodo, type SexCalc, type InputMedidas, type ResultadosCalculados } from "@/lib/antropometria-calculos"

interface UserOption {
  id: string
  name: string | null
  email: string | null
  profile: { fullName: string | null; age: number | null; sex: string | null } | null
}

interface Nutricionista {
  id: string
  nombre: string
  color: string
}

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
  // Diámetros
  diametroBiacromial: number | null
  diametroToraxTransverso: number | null
  diametroToraxAnteroposterior: number | null
  diametroBiiliocrestideo: number | null
  diametroBiepicondileoHumeral: number | null
  diametroBiepicondileoFemoral: number | null
  diametroMunieca: number | null
  // Perímetros
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
  // Pliegues
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

function suma6(a: Antropometria): number | null {
  const vals = [a.pliegueTriceps, a.pliegueSubescapular, a.pliegueSupraespinal, a.pliegueAbdominal, a.pliegueMusloMedial, a.plieguePantorrilla]
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

function KpiCard({ label, value, unit, d, goodDir, color }: {
  label: string; value: number | null; unit: string
  d: ReturnType<typeof delta>; goodDir: "up" | "down"; color: string
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

const SVG_W = 400
const SVG_H_VB = 100
const SVG_H_PX = 80
const SVG_PAD = 8
const TIP_W = 90
const CIRCLE_R = 6

interface TooltipState {
  visible: boolean; tipX: number; tipY: number; arrowOffset: number; valor: string; fecha: string
}

function LineChart({ points, label, unit, color }: {
  points: { fecha: string; value: number }[]
  label: string; unit: string; color: string
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
    x: SVG_PAD + (i / (points.length - 1)) * (SVG_W - SVG_PAD * 2),
    y: SVG_PAD + (1 - (p.value - minV) / range) * (SVG_H_VB - SVG_PAD * 2),
    ...p,
  }))

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ")
  const first = coords[0]
  const last = coords[coords.length - 1]

  function showTooltip(c: (typeof coords)[number]) {
    const containerW = containerRef.current?.getBoundingClientRect().width ?? SVG_W
    const centerX = (c.x / SVG_W) * containerW
    const tipX = Math.min(Math.max(centerX - TIP_W / 2, 0), containerW - TIP_W)
    const arrowOffset = Math.min(Math.max(centerX - tipX - 5, 4), TIP_W - 14)
    const tipY = c.y * (SVG_H_PX / SVG_H_VB) - CIRCLE_R
    setTooltip({
      visible: true, tipX, tipY, arrowOffset,
      valor: `${c.value} ${unit}`,
      fecha: new Date(c.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{new Date(first.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
        <span>{new Date(last.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
      </div>
      <div ref={containerRef} className="relative" onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H_VB}`} preserveAspectRatio="none" className="w-full" style={{ height: SVG_H_PX, display: "block" }}>
          <polyline fill="none" stroke={color} strokeWidth="2.5" points={polyline} />
          {coords.map((c, i) => (
            <circle
              key={i} cx={c.x} cy={c.y}
              r={i === coords.length - 1 ? CIRCLE_R : 4}
              fill={i === coords.length - 1 ? color : "white"}
              stroke={color} strokeWidth="2"
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
            style={{ left: tooltip.tipX, top: tooltip.tipY, transform: "translateY(-100%)", width: TIP_W }}
          >
            <div className="text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg" style={{ background: "rgba(17,24,39,0.9)" }}>
              <p className="font-semibold truncate">{tooltip.valor}</p>
              <p style={{ color: "#9ca3af" }}>{tooltip.fecha}</p>
            </div>
            <div style={{
              marginLeft: tooltip.arrowOffset, width: 0, height: 0,
              borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
              borderTop: "5px solid rgba(17,24,39,0.9)",
            }} />
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

// ── Formulario ─────────────────────────────────────────────────────────────────

const BLANK_FORM = {
  fecha: new Date().toISOString().slice(0, 10),
  nutricionistaId: "",
  // Básicos
  pesoKg: "",
  tallaCm: "",
  tallaSentado: "",
  // Diámetros
  diametroBiacromial: "",
  diametroToraxTransverso: "",
  diametroToraxAnteroposterior: "",
  diametroBiiliocrestideo: "",
  diametroBiepicondileoHumeral: "",
  diametroBiepicondileoFemoral: "",
  diametroMunieca: "",
  // Perímetros
  perimetroCabeza: "",
  brazoRelajado: "",
  brazoFlexionado: "",
  perimetroAntebrazo: "",
  toraxMesoesternal: "",
  cinturaMinima: "",
  caderaMaxima: "",
  musloSuperior: "",
  musloMedial: "",
  pantorrillaMaxima: "",
  // Pliegues
  pliegueSubescapular: "",
  pliegueTriceps: "",
  pliegueSupraespinal: "",
  pliegueAbdominal: "",
  pliegueMusloMedial: "",
  plieguePantorrilla: "",
  notas: "",
}

type FormState = typeof BLANK_FORM

// Campos FIJO: se precargan de la última medición
const FIJO_FIELDS = [
  "tallaCm", "tallaSentado",
  "diametroBiacromial", "diametroToraxTransverso", "diametroToraxAnteroposterior",
  "diametroBiiliocrestideo", "diametroBiepicondileoHumeral", "diametroBiepicondileoFemoral",
  "diametroMunieca", "perimetroCabeza",
] as const

type FijoField = typeof FIJO_FIELDS[number]

function prefillFijo(latest: Antropometria): Partial<FormState> {
  const patch: Partial<FormState> = {}
  for (const k of FIJO_FIELDS) {
    const v = latest[k as keyof Antropometria]
    if (v !== null && v !== undefined) {
      patch[k as FijoField] = String(v)
    }
  }
  return patch
}

function n(v: string) {
  return v ? Number(v) : undefined
}

function Preview({ form, sexo, edad }: { form: FormState; sexo: string | null; edad: number | null }) {
  if (!form.pesoKg || !form.tallaCm) return null
  const result = calcularTodo({
    pesoKg: Number(form.pesoKg),
    tallaCm: Number(form.tallaCm),
    edad: edad ?? 25,
    sexo: (sexo as "MALE" | "FEMALE") ?? "MALE",
    cinturaMinima: n(form.cinturaMinima),
    caderaMaxima: n(form.caderaMaxima),
    brazoFlexionado: n(form.brazoFlexionado),
    musloSuperior: n(form.musloSuperior),
    pantorrillaMaxima: n(form.pantorrillaMaxima),
    pliegueSubescapular: n(form.pliegueSubescapular),
    pliegueTriceps: n(form.pliegueTriceps),
    pliegueSupraespinal: n(form.pliegueSupraespinal),
    pliegueAbdominal: n(form.pliegueAbdominal),
    pliegueMusloMedial: n(form.pliegueMusloMedial),
    plieguePantorrilla: n(form.plieguePantorrilla),
    diametroBiepicondileoFemoral: n(form.diametroBiepicondileoFemoral),
    diametroBiepicondileoHumeral: n(form.diametroBiepicondileoHumeral),
    diametroMunieca: n(form.diametroMunieca),
  })

  const suma6vals = [n(form.pliegueTriceps), n(form.pliegueSubescapular), n(form.pliegueSupraespinal), n(form.pliegueAbdominal), n(form.pliegueMusloMedial), n(form.plieguePantorrilla)]
  const suma6 = suma6vals.every(Boolean)
    ? `${Math.round((suma6vals as number[]).reduce((a, b) => a + b, 0) * 10) / 10} mm`
    : "—"

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">Vista previa calculada</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-white rounded-lg p-3 border border-emerald-100">
          <p className="text-xs text-gray-400 mb-1">Suma 6 pliegues</p>
          <p className="font-bold text-orange-500 text-lg">{suma6}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-emerald-100">
          <p className="text-xs text-gray-400 mb-1">Masa muscular</p>
          <p className="font-bold text-blue-600 text-lg">{result.masaMuscularKg !== undefined ? `${result.masaMuscularKg} kg` : "—"}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-emerald-100">
          <p className="text-xs text-gray-400 mb-1">Peso</p>
          <p className="font-bold text-gray-700 text-lg">{form.pesoKg ? `${form.pesoKg} kg` : "—"}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-emerald-100">
          <p className="text-xs text-gray-400 mb-1">Tejido adiposo</p>
          <p className="font-bold text-rose-500 text-lg">{result.masaGrasaKg !== undefined ? `${result.masaGrasaKg} kg` : "—"}</p>
        </div>
      </div>
    </div>
  )
}

// ── Fraccionamiento 5 Componentes ─────────────────────────────────────────────

function medicionToInput(m: Antropometria, sexo: SexCalc, edad: number): InputMedidas {
  return {
    pesoKg: m.pesoKg,
    tallaCm: m.tallaCm,
    edad,
    sexo,
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

function calcAjustado(masa: number, pesoEstructurado: number, pesoReal: number) {
  const diff = pesoEstructurado - pesoReal
  return masa - diff * (masa / pesoEstructurado)
}

function calcPesoEstructurado(c: ResultadosCalculados) {
  const { masaAdiposaKg: a, masaMuscularKg: m, masaResidualKg: r, masaOseaKg: o, masaPielKg: p } = c
  if (a === undefined || m === undefined || r === undefined || o === undefined || p === undefined) return null
  return a + m + r + o + p
}

function ScoreZCell({ z }: { z: number | undefined }) {
  if (z === undefined) return <span className="text-gray-300">—</span>
  const color = Math.abs(z) <= 1 ? "text-emerald-600" : Math.abs(z) <= 2 ? "text-amber-500" : "text-red-500"
  return <span className={color}>{z.toFixed(2)}</span>
}

function DifCell({ dif, goodDir }: { dif: number | null; goodDir: "up" | "down" }) {
  if (dif === null) return <span className="text-gray-300">—</span>
  if (dif === 0) return <span className="text-gray-400">0.000</span>
  const isGood = goodDir === "down" ? dif < 0 : dif > 0
  const color = isGood ? "text-emerald-600" : "text-rose-500"
  const sign = dif > 0 ? "+" : ""
  return <span className={color}>{sign}{dif.toFixed(3)}</span>
}

function FraccionamientoModal({
  item,
  prev,
  sexo,
  edad,
  onClose,
}: {
  item: Antropometria
  prev: Antropometria | null
  sexo: SexCalc
  edad: number
  onClose: () => void
}) {
  const calc = calcularTodo(medicionToInput(item, sexo, edad))
  const prevCalc = prev ? calcularTodo(medicionToInput(prev, sexo, edad)) : null

  const pe = calcPesoEstructurado(calc)
  const prevPe = prevCalc ? calcPesoEstructurado(prevCalc) : null

  function ajustar(masa: number, pesoReal: number, pesoEstr: number) {
    return calcAjustado(masa, pesoEstr, pesoReal)
  }

  function prevDif(masa: number | undefined, prevMasaField: number | undefined): number | null {
    if (!prevCalc || masa === undefined || prevMasaField === undefined || !prevPe) return null
    const adj = pe ? ajustar(masa, item.pesoKg, pe) : null
    const prevAdj = ajustar(prevMasaField, prev!.pesoKg, prevPe)
    if (adj === null) return null
    return Math.round((adj - prevAdj) * 1000) / 1000
  }

  const incomplete = pe === null

  type FracRow = {
    label: string
    masa: number | undefined
    scoreZ: number | undefined
    prevMasa: number | undefined
    goodDir: "up" | "down"
  }

  const rows: FracRow[] = [
    { label: "Masa Adiposa",   masa: calc.masaAdiposaKg,  scoreZ: calc.scoreZAdiposa,   prevMasa: prevCalc?.masaAdiposaKg,  goodDir: "down" },
    { label: "Masa Muscular",  masa: calc.masaMuscularKg, scoreZ: calc.scoreZMuscular,  prevMasa: prevCalc?.masaMuscularKg, goodDir: "up"   },
    { label: "Masa Residual",  masa: calc.masaResidualKg, scoreZ: calc.scoreZResidual,  prevMasa: prevCalc?.masaResidualKg, goodDir: "down" },
    { label: "Masa Ósea",     masa: calc.masaOseaKg,     scoreZ: calc.scoreZOseaCuerpo, prevMasa: prevCalc?.masaOseaKg,     goodDir: "up"   },
    { label: "Masa de Piel",   masa: calc.masaPielKg,     scoreZ: undefined,            prevMasa: prevCalc?.masaPielKg,     goodDir: "down" },
  ]

  const totalDif = (prevCalc && prev)
    ? Math.round((item.pesoKg - prev.pesoKg) * 1000) / 1000
    : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800 text-base">Fraccionamiento 5 Componentes</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              D. Kerr, 1988 · {new Date(item.fecha).toLocaleDateString("es-AR")} · {item.pesoKg} kg
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-x-auto">
          {incomplete ? (
            <div className="text-sm text-gray-500 py-4">
              <p className="font-medium text-gray-700 mb-2">Datos insuficientes para el fraccionamiento completo.</p>
              <p>Se requieren: 6 pliegues, 5 perímetros (brazo relajado, antebrazo, muslo superior, pantorrilla, tórax mesoesternal), talla sentado, cintura mínima, tórax transverso y AP, diámetros biacromial, biiliocrestídeo, humeral y femoral, y perímetro de cabeza.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 uppercase tracking-wide">
                  <th className="text-left py-2 font-medium">Masa</th>
                  <th className="text-right py-2 font-medium">%</th>
                  <th className="text-right py-2 font-medium">Kg</th>
                  <th className="text-right py-2 font-medium">Score-Z</th>
                  {prevCalc && <th className="text-right py-2 font-medium">Dif.</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => {
                  const pct = row.masa !== undefined && pe ? (row.masa / pe) * 100 : null
                  const adj = row.masa !== undefined && pe ? ajustar(row.masa, item.pesoKg, pe) : null
                  const dif = prevDif(row.masa, row.prevMasa)
                  return (
                    <tr key={row.label} className="hover:bg-gray-50">
                      <td className="py-2.5 text-gray-700 font-medium">{row.label}</td>
                      <td className="py-2.5 text-right text-gray-500">{pct !== null ? pct.toFixed(2) + "%" : "—"}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-800">{adj !== null ? adj.toFixed(3) : "—"}</td>
                      <td className="py-2.5 text-right"><ScoreZCell z={row.scoreZ} /></td>
                      {prevCalc && <td className="py-2.5 text-right"><DifCell dif={dif} goodDir={row.goodDir} /></td>}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-bold">
                  <td className="py-2.5 text-gray-800">Masa Total</td>
                  <td className="py-2.5 text-right text-gray-500">100%</td>
                  <td className="py-2.5 text-right text-gray-800">{item.pesoKg.toFixed(3)}</td>
                  <td className="py-2.5 text-right text-gray-300">—</td>
                  {prevCalc && <td className="py-2.5 text-right"><DifCell dif={totalDif} goodDir="down" /></td>}
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer */}
        {!incomplete && pe !== null && (
          <div className="px-6 pb-5 border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-500 italic">
              Porcentaje de diferencia ↑ Peso Estructurado − Peso Bruto:{" "}
              <span className="font-semibold text-gray-700">
                {Math.abs((pe - item.pesoKg) / item.pesoKg * 100).toFixed(2)}%
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Peso Estructurado: <span className="font-medium">{pe.toFixed(3)} kg</span>
              {" · "}Peso Bruto: <span className="font-medium">{item.pesoKg} kg</span>
              {calc.metabolismoBasalHarrisBenedict !== undefined && (
                <>
                  {" · "}MB Harris-Benedict: <span className="font-medium">{calc.metabolismoBasalHarrisBenedict} kcal</span>
                </>
              )}
              {calc.metabolismoBasalKleiber !== undefined && (
                <>
                  {" · "}Kleiber: <span className="font-medium">{calc.metabolismoBasalKleiber} kcal</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldInput({ label, name, value, onChange, step = "0.1", unit, fixed }: {
  label: string; name: string; value: string; onChange: (v: string) => void
  step?: string; unit?: string; fixed?: boolean
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">
        {label}
        {unit && <span className="text-gray-400"> ({unit})</span>}
        {fixed && <span className="ml-1 text-gray-300 text-[10px]">🔒</span>}
      </label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
          fixed ? "border-gray-150 bg-gray-50 text-gray-600" : "border-gray-200"
        }`}
        placeholder="—"
      />
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export function AntropometriaTab() {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserOption[]>([])
  const [nutritionists, setNutritionists] = useState<Nutricionista[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [search, setSearch] = useState("")
  const [history, setHistory] = useState<Antropometria[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [form, setForm] = useState<FormState>(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modalMedicion, setModalMedicion] = useState<{ item: Antropometria; prev: Antropometria | null } | null>(null)

  useEffect(() => {
    fetch("/api/admin/users?role=USER")
      .then((r) => r.json())
      .then((j) => setUsers(j.users ?? []))
    fetch("/api/admin/nutritionists")
      .then((r) => r.json())
      .then((j) => setNutritionists(j.nutritionists ?? []))
  }, [])

  useEffect(() => {
    if (!selectedUserId) { setHistory([]); setForm(BLANK_FORM); return }
    setLoadingHistory(true)
    fetch(`/api/admin/antropometria/${selectedUserId}`)
      .then((r) => r.json())
      .then((j) => {
        const rows: Antropometria[] = j.antropometrias ?? []
        setHistory(rows)
        // Precargar campos FIJO de la última medición
        if (rows.length > 0) {
          setForm((prev) => ({ ...prev, ...prefillFijo(rows[0]) }))
        }
      })
      .finally(() => setLoadingHistory(false))
  }, [selectedUserId])

  const setField = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const selectedUser = users.find((u) => u.id === selectedUserId)

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase()
    return (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.profile?.fullName ?? "").toLowerCase().includes(q)
  })

  async function handleSave() {
    if (!selectedUserId) { setMsg("Seleccioná un paciente primero."); return }
    if (!form.pesoKg || !form.tallaCm) { setMsg("Peso y talla son requeridos."); return }
    setSaving(true)
    setMsg("")
    try {
      const res = await fetch(`/api/admin/antropometria/${selectedUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHistory((h) => [data.antropometria, ...h])
      // Mantener FIJO de la medición recién guardada, limpiar DINÁMICO
      setForm({
        ...BLANK_FORM,
        fecha: new Date().toISOString().slice(0, 10),
        nutricionistaId: form.nutricionistaId,
        ...prefillFijo(data.antropometria),
      })
      setMsg("✓ Medición guardada correctamente.")
    } catch (e: unknown) {
      setMsg("Error: " + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setPendingDeleteId(null)
    setDeletingId(id)
    try {
      await fetch(`/api/admin/antropometria/entry/${id}`, { method: "DELETE" })
      setHistory((h) => h.filter((x) => x.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Antropometría</h2>

      {/* Selector de paciente */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Seleccionar paciente</p>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg divide-y">
          {filteredUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => { setSelectedUserId(u.id); setSearch(""); setMsg("") }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedUserId === u.id ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-700"}`}
            >
              {u.profile?.fullName ?? u.name ?? u.email}
              <span className="text-xs text-gray-400 ml-2">{u.email}</span>
            </button>
          ))}
          {filteredUsers.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>}
        </div>
      </div>

      {selectedUser && (
        <>
          {/* Formulario nueva medición */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">
                Nueva medición —{" "}
                <span className="text-emerald-600">{selectedUser.profile?.fullName ?? selectedUser.name}</span>
              </p>
              <span className="text-xs text-gray-400">🔒 = se precarga de la última medición</span>
            </div>

            {/* Fecha y nutricionista */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setField("fecha")(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Nutricionista</label>
                <select
                  value={form.nutricionistaId}
                  onChange={(e) => setField("nutricionistaId")(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="">Sin asignar</option>
                  {nutritionists.map((nc) => (
                    <option key={nc.id} value={nc.id}>{nc.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Básicos */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Básicos</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <FieldInput label="Peso" name="pesoKg" value={form.pesoKg} onChange={setField("pesoKg")} unit="kg" />
              <FieldInput label="Talla" name="tallaCm" value={form.tallaCm} onChange={setField("tallaCm")} unit="cm" fixed />
              <FieldInput label="Talla sentado" name="tallaSentado" value={form.tallaSentado} onChange={setField("tallaSentado")} unit="cm" fixed />
            </div>

            {/* Diámetros */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Diámetros (cm) 🔒</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <FieldInput label="Biacromial" name="diametroBiacromial" value={form.diametroBiacromial} onChange={setField("diametroBiacromial")} unit="cm" fixed />
              <FieldInput label="Tórax Transverso" name="diametroToraxTransverso" value={form.diametroToraxTransverso} onChange={setField("diametroToraxTransverso")} unit="cm" fixed />
              <FieldInput label="Tórax Anteroposterior" name="diametroToraxAnteroposterior" value={form.diametroToraxAnteroposterior} onChange={setField("diametroToraxAnteroposterior")} unit="cm" fixed />
              <FieldInput label="Bi-iliocrestídeo" name="diametroBiiliocrestideo" value={form.diametroBiiliocrestideo} onChange={setField("diametroBiiliocrestideo")} unit="cm" fixed />
              <FieldInput label="Humeral/biepicondilar" name="diametroBiepicondileoHumeral" value={form.diametroBiepicondileoHumeral} onChange={setField("diametroBiepicondileoHumeral")} unit="cm" fixed />
              <FieldInput label="Femoral/biepicondilar" name="diametroBiepicondileoFemoral" value={form.diametroBiepicondileoFemoral} onChange={setField("diametroBiepicondileoFemoral")} unit="cm" fixed />
              <FieldInput label="Muñeca" name="diametroMunieca" value={form.diametroMunieca} onChange={setField("diametroMunieca")} unit="cm" fixed />
            </div>

            {/* Perímetros */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Perímetros (cm)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <FieldInput label="Cabeza" name="perimetroCabeza" value={form.perimetroCabeza} onChange={setField("perimetroCabeza")} unit="cm" fixed />
              <FieldInput label="Brazo relajado" name="brazoRelajado" value={form.brazoRelajado} onChange={setField("brazoRelajado")} unit="cm" />
              <FieldInput label="Brazo flexionado en tensión" name="brazoFlexionado" value={form.brazoFlexionado} onChange={setField("brazoFlexionado")} unit="cm" />
              <FieldInput label="Antebrazo" name="perimetroAntebrazo" value={form.perimetroAntebrazo} onChange={setField("perimetroAntebrazo")} unit="cm" />
              <FieldInput label="Tórax Mesoesternal" name="toraxMesoesternal" value={form.toraxMesoesternal} onChange={setField("toraxMesoesternal")} unit="cm" />
              <FieldInput label="Cintura mínima" name="cinturaMinima" value={form.cinturaMinima} onChange={setField("cinturaMinima")} unit="cm" />
              <FieldInput label="Caderas máxima" name="caderaMaxima" value={form.caderaMaxima} onChange={setField("caderaMaxima")} unit="cm" />
              <FieldInput label="Muslo superior" name="musloSuperior" value={form.musloSuperior} onChange={setField("musloSuperior")} unit="cm" />
              <FieldInput label="Muslo medial" name="musloMedial" value={form.musloMedial} onChange={setField("musloMedial")} unit="cm" />
              <FieldInput label="Pantorrilla máxima" name="pantorrillaMaxima" value={form.pantorrillaMaxima} onChange={setField("pantorrillaMaxima")} unit="cm" />
            </div>

            {/* Pliegues */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pliegues cutáneos (mm)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <FieldInput label="Tríceps" name="pliegueTriceps" value={form.pliegueTriceps} onChange={setField("pliegueTriceps")} unit="mm" />
              <FieldInput label="Subescapular" name="pliegueSubescapular" value={form.pliegueSubescapular} onChange={setField("pliegueSubescapular")} unit="mm" />
              <FieldInput label="Supraespinal" name="pliegueSupraespinal" value={form.pliegueSupraespinal} onChange={setField("pliegueSupraespinal")} unit="mm" />
              <FieldInput label="Abdominal" name="pliegueAbdominal" value={form.pliegueAbdominal} onChange={setField("pliegueAbdominal")} unit="mm" />
              <FieldInput label="Muslo medial" name="pliegueMusloMedial" value={form.pliegueMusloMedial} onChange={setField("pliegueMusloMedial")} unit="mm" />
              <FieldInput label="Pantorrilla" name="plieguePantorrilla" value={form.plieguePantorrilla} onChange={setField("plieguePantorrilla")} unit="mm" />
            </div>

            {/* Notas */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">Notas</label>
              <textarea
                value={form.notas}
                onChange={(e) => setField("notas")(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Observaciones opcionales..."
              />
            </div>

            {/* Vista previa */}
            <Preview form={form} sexo={selectedUser.profile?.sex ?? null} edad={selectedUser.profile?.age ?? null} />

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Guardando..." : "Guardar medición"}
              </button>
              {msg && (
                <span className={`text-sm ${msg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>{msg}</span>
              )}
            </div>
          </div>

          {/* Historial */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Historial de mediciones</p>
            {loadingHistory && <p className="text-sm text-gray-400">Cargando...</p>}
            {!loadingHistory && history.length === 0 && (
              <p className="text-sm text-gray-400">Sin mediciones registradas.</p>
            )}
            <div className="space-y-2">
              {history.map((item, i) => {
                const prev = history[i + 1] ?? null
                const latestSuma = suma6(item)
                const prevSuma = prev ? suma6(prev) : null
                return (
                  <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-700 text-sm">
                          {new Date(item.fecha).toLocaleDateString("es-AR")}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.pesoKg} kg
                          <DeltaBadge d={delta(item.pesoKg, prev?.pesoKg ?? null)} goodDir="down" />
                          {" · "}{item.tallaCm} cm
                        </span>
                        {item.imc !== null && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">IMC {item.imc.toFixed(1)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModalMedicion({ item, prev })}
                          className="text-emerald-500 hover:text-emerald-700 p-1 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Ver fraccionamiento 5 componentes"
                        >
                          <Search size={15} />
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(item.id)}
                          disabled={deletingId === item.id}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {deletingId === item.id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {latestSuma !== null && (
                        <div>
                          <span className="text-gray-400 block text-xs">Suma 6 pliegues</span>
                          <p className="font-semibold text-orange-500">
                            {latestSuma} mm
                            <DeltaBadge d={delta(latestSuma, prevSuma)} goodDir="down" />
                          </p>
                        </div>
                      )}
                      {item.masaMuscularKg !== null && (
                        <div>
                          <span className="text-gray-400 block text-xs">Masa muscular</span>
                          <p className="font-semibold text-blue-600">
                            {item.masaMuscularKg} kg
                            <DeltaBadge d={delta(item.masaMuscularKg, prev?.masaMuscularKg ?? null)} goodDir="up" />
                          </p>
                        </div>
                      )}
                      {item.masaGrasaKg !== null && (
                        <div>
                          <span className="text-gray-400 block text-xs">Tejido adiposo</span>
                          <p className="font-semibold text-rose-500">
                            {item.masaGrasaKg} kg
                            <DeltaBadge d={delta(item.masaGrasaKg, prev?.masaGrasaKg ?? null)} goodDir="down" />
                          </p>
                        </div>
                      )}
                      {item.porcentajeGrasa !== null && (
                        <div>
                          <span className="text-gray-400 block text-xs">% Grasa</span>
                          <p className="font-semibold text-amber-600">
                            {item.porcentajeGrasa}%
                            <DeltaBadge d={delta(item.porcentajeGrasa, prev?.porcentajeGrasa ?? null)} goodDir="down" />
                          </p>
                        </div>
                      )}
                      {item.cinturaMinima !== null && (
                        <div>
                          <span className="text-gray-400 block text-xs">Cintura mínima</span>
                          <p className="font-semibold text-gray-700">
                            {item.cinturaMinima} cm
                            <DeltaBadge d={delta(item.cinturaMinima, prev?.cinturaMinima ?? null)} goodDir="down" />
                          </p>
                        </div>
                      )}
                      {item.caderaMaxima !== null && (
                        <div>
                          <span className="text-gray-400 block text-xs">Caderas máxima</span>
                          <p className="font-semibold text-gray-700">
                            {item.caderaMaxima} cm
                            <DeltaBadge d={delta(item.caderaMaxima, prev?.caderaMaxima ?? null)} goodDir="down" />
                          </p>
                        </div>
                      )}
                      {item.musloSuperior !== null && (
                        <div>
                          <span className="text-gray-400 block text-xs">Muslo superior</span>
                          <p className="font-semibold text-gray-700">
                            {item.musloSuperior} cm
                            <DeltaBadge d={delta(item.musloSuperior, prev?.musloSuperior ?? null)} goodDir="down" />
                          </p>
                        </div>
                      )}
                      {item.pantorrillaMaxima !== null && (
                        <div>
                          <span className="text-gray-400 block text-xs">Pantorrilla máxima</span>
                          <p className="font-semibold text-gray-700">
                            {item.pantorrillaMaxima} cm
                            <DeltaBadge d={delta(item.pantorrillaMaxima, prev?.pantorrillaMaxima ?? null)} goodDir="down" />
                          </p>
                        </div>
                      )}
                      {item.notas && (
                        <div className="col-span-full mt-1">
                          <span className="text-gray-400 text-xs">Notas: </span>
                          <span className="text-gray-600 text-xs">{item.notas}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Evolución del paciente */}
          {history.length >= 2 && (() => {
            const latest = history[0]
            const prev = history[1]
            const latestSuma = suma6(latest)
            const prevSuma = suma6(prev)
            const asc = [...history].reverse()
            const puntosPliegues = asc.map((d) => ({ fecha: d.fecha, value: suma6(d) })).filter((p) => p.value !== null) as { fecha: string; value: number }[]
            const puntosMusculo = asc.map((d) => ({ fecha: d.fecha, value: d.masaMuscularKg })).filter((p) => p.value !== null) as { fecha: string; value: number }[]
            const puntosPeso = asc.map((d) => ({ fecha: d.fecha, value: d.pesoKg }))
            const puntosGrasa = asc.map((d) => ({ fecha: d.fecha, value: d.masaGrasaKg })).filter((p) => p.value !== null) as { fecha: string; value: number }[]
            return (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-base font-bold text-gray-700">Evolución del paciente</h3>
                  <p className="text-xs text-gray-400">
                    Última: {new Date(latest.fecha).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <KpiCard label="Suma 6 pliegues" value={latestSuma} unit="mm" d={delta(latestSuma, prevSuma)} goodDir="down" color="text-orange-500" />
                  <KpiCard label="Masa muscular" value={latest.masaMuscularKg} unit="kg" d={delta(latest.masaMuscularKg, prev.masaMuscularKg)} goodDir="up" color="text-blue-600" />
                  <KpiCard label="Peso" value={latest.pesoKg} unit="kg" d={delta(latest.pesoKg, prev.pesoKg)} goodDir="down" color="text-gray-700" />
                  <KpiCard label="Tejido adiposo" value={latest.masaGrasaKg} unit="kg" d={delta(latest.masaGrasaKg, prev.masaGrasaKg)} goodDir="down" color="text-rose-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <LineChart points={puntosPliegues} label="Suma 6 pliegues" unit="mm" color="#f97316" />
                  <LineChart points={puntosMusculo} label="Masa muscular" unit="kg" color="#2563eb" />
                  <LineChart points={puntosPeso} label="Peso" unit="kg" color="#374151" />
                  <LineChart points={puntosGrasa} label="Tejido adiposo" unit="kg" color="#f43f5e" />
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* Modal fraccionamiento */}
      {modalMedicion && (
        <FraccionamientoModal
          item={modalMedicion.item}
          prev={modalMedicion.prev}
          sexo={(selectedUser?.profile?.sex as SexCalc) ?? "FEMALE"}
          edad={selectedUser?.profile?.age ?? 25}
          onClose={() => setModalMedicion(null)}
        />
      )}

      {pendingDeleteId && (
        <ConfirmDialog
          message="¿Eliminar esta medición? Esta acción no se puede deshacer."
          onConfirm={() => handleDelete(pendingDeleteId)}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  )
}
