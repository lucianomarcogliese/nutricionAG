"use client"

import { useEffect, useRef, useState } from "react"
import { calcularTodo } from "@/lib/antropometria-calculos"

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
  cinturaCm: number | null
  caderaCm: number | null
  brazoCm: number | null
  musloDerechoCm: number | null
  pantorrillaDerechaCm: number | null
  pliegueSubescapular: number | null
  pliegueTriceps: number | null
  pliegueSuprailiaco: number | null
  pliegueAbdominal: number | null
  pliegueMusloAnterior: number | null
  plieguePantorrilla: number | null
  diametroBiepicondileoFemoral: number | null
  diametroBiepicondileoHumeral: number | null
  diametroMunieca: number | null
  notas: string | null
  nutricionista: { id: string; nombre: string; color: string } | null
}

// ── Chart helpers (mirrors AntropometriaView.tsx) ──────────────────────────

function suma6(a: Antropometria): number | null {
  const vals = [a.pliegueTriceps, a.pliegueSubescapular, a.pliegueSuprailiaco, a.pliegueAbdominal, a.pliegueMusloAnterior, a.plieguePantorrilla]
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
const SVG_H_VB = 100  // viewBox height
const SVG_H_PX = 80   // rendered px height
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

// ───────────────────────────────────────────────────────────────────────────

const BLANK_FORM = {
  fecha: new Date().toISOString().slice(0, 10),
  nutricionistaId: "",
  pesoKg: "",
  tallaCm: "",
  cinturaCm: "",
  caderaCm: "",
  brazoCm: "",
  musloDerechoCm: "",
  pantorrillaDerechaCm: "",
  pliegueSubescapular: "",
  pliegueTriceps: "",
  pliegueSuprailiaco: "",
  pliegueAbdominal: "",
  pliegueMusloAnterior: "",
  plieguePantorrilla: "",
  pliegueAxilarMedio: "",
  plieguePectoral: "",
  diametroBiepicondileoFemoral: "",
  diametroBiepicondileoHumeral: "",
  diametroMunieca: "",
  notas: "",
}

type FormState = typeof BLANK_FORM

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
    cinturaCm: n(form.cinturaCm),
    caderaCm: n(form.caderaCm),
    brazoCm: n(form.brazoCm),
    musloDerechoCm: n(form.musloDerechoCm),
    pantorrillaDerechaCm: n(form.pantorrillaDerechaCm),
    pliegueSubescapular: n(form.pliegueSubescapular),
    pliegueTriceps: n(form.pliegueTriceps),
    pliegueSuprailiaco: n(form.pliegueSuprailiaco),
    pliegueAbdominal: n(form.pliegueAbdominal),
    pliegueMusloAnterior: n(form.pliegueMusloAnterior),
    plieguePantorrilla: n(form.plieguePantorrilla),
    diametroBiepicondileoFemoral: n(form.diametroBiepicondileoFemoral),
    diametroBiepicondileoHumeral: n(form.diametroBiepicondileoHumeral),
    diametroMunieca: n(form.diametroMunieca),
  })
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">Vista previa calculada</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-white rounded-lg p-3 border border-emerald-100">
          <p className="text-xs text-gray-400 mb-1">Suma 6 pliegues</p>
          <p className="font-bold text-orange-500 text-lg">
            {[n(form.pliegueTriceps), n(form.pliegueSubescapular), n(form.pliegueSuprailiaco), n(form.pliegueAbdominal), n(form.pliegueMusloAnterior), n(form.plieguePantorrilla)].every(Boolean)
              ? `${Math.round(([n(form.pliegueTriceps)!, n(form.pliegueSubescapular)!, n(form.pliegueSuprailiaco)!, n(form.pliegueAbdominal)!, n(form.pliegueMusloAnterior)!, n(form.plieguePantorrilla)!].reduce((a, b) => a + b, 0)) * 10) / 10} mm`
              : "—"}
          </p>
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

function FieldInput({ label, name, value, onChange, step = "0.1", unit }: {
  label: string; name: string; value: string; onChange: (v: string) => void; step?: string; unit?: string
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}{unit && <span className="text-gray-400"> ({unit})</span>}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        placeholder="—"
      />
    </div>
  )
}

export function AntropometriaTab() {
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

  useEffect(() => {
    fetch("/api/admin/users?role=USER")
      .then((r) => r.json())
      .then((j) => setUsers(j.users ?? []))
    fetch("/api/admin/nutritionists")
      .then((r) => r.json())
      .then((j) => setNutritionists(j.nutritionists ?? []))
  }, [])

  useEffect(() => {
    if (!selectedUserId) { setHistory([]); return }
    setLoadingHistory(true)
    fetch(`/api/admin/antropometria/${selectedUserId}`)
      .then((r) => r.json())
      .then((j) => setHistory(j.antropometrias ?? []))
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
      setForm(BLANK_FORM)
      setMsg("✓ Medición guardada correctamente.")
    } catch (e: unknown) {
      setMsg("Error: " + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta medición?")) return
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
            <p className="text-sm font-semibold text-gray-700 mb-4">
              Nueva medición —{" "}
              <span className="text-emerald-600">{selectedUser.profile?.fullName ?? selectedUser.name}</span>
            </p>

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
                  {nutritionists.map((n) => (
                    <option key={n.id} value={n.id}>{n.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Medidas básicas</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <FieldInput label="Peso" name="pesoKg" value={form.pesoKg} onChange={setField("pesoKg")} unit="kg" />
              <FieldInput label="Talla" name="tallaCm" value={form.tallaCm} onChange={setField("tallaCm")} unit="cm" />
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Perímetros</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <FieldInput label="Cintura" name="cinturaCm" value={form.cinturaCm} onChange={setField("cinturaCm")} unit="cm" />
              <FieldInput label="Cadera" name="caderaCm" value={form.caderaCm} onChange={setField("caderaCm")} unit="cm" />
              <FieldInput label="Brazo contraído" name="brazoCm" value={form.brazoCm} onChange={setField("brazoCm")} unit="cm" />
              <FieldInput label="Muslo derecho" name="musloDerechoCm" value={form.musloDerechoCm} onChange={setField("musloDerechoCm")} unit="cm" />
              <FieldInput label="Pantorrilla derecha" name="pantorrillaDerechaCm" value={form.pantorrillaDerechaCm} onChange={setField("pantorrillaDerechaCm")} unit="cm" />
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pliegues cutáneos</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <FieldInput label="Subescapular" name="pliegueSubescapular" value={form.pliegueSubescapular} onChange={setField("pliegueSubescapular")} unit="mm" />
              <FieldInput label="Tríceps" name="pliegueTriceps" value={form.pliegueTriceps} onChange={setField("pliegueTriceps")} unit="mm" />
              <FieldInput label="Suprailiaco" name="pliegueSuprailiaco" value={form.pliegueSuprailiaco} onChange={setField("pliegueSuprailiaco")} unit="mm" />
              <FieldInput label="Abdominal" name="pliegueAbdominal" value={form.pliegueAbdominal} onChange={setField("pliegueAbdominal")} unit="mm" />
              <FieldInput label="Muslo anterior" name="pliegueMusloAnterior" value={form.pliegueMusloAnterior} onChange={setField("pliegueMusloAnterior")} unit="mm" />
              <FieldInput label="Pantorrilla" name="plieguePantorrilla" value={form.plieguePantorrilla} onChange={setField("plieguePantorrilla")} unit="mm" />
              <FieldInput label="Axilar medio" name="pliegueAxilarMedio" value={form.pliegueAxilarMedio} onChange={setField("pliegueAxilarMedio")} unit="mm" />
              <FieldInput label="Pectoral" name="plieguePectoral" value={form.plieguePectoral} onChange={setField("plieguePectoral")} unit="mm" />
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Diámetros óseos</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <FieldInput label="Biepicondileo femoral" name="diametroBiepicondileoFemoral" value={form.diametroBiepicondileoFemoral} onChange={setField("diametroBiepicondileoFemoral")} unit="cm" />
              <FieldInput label="Biepicondileo humeral" name="diametroBiepicondileoHumeral" value={form.diametroBiepicondileoHumeral} onChange={setField("diametroBiepicondileoHumeral")} unit="cm" />
              <FieldInput label="Muñeca" name="diametroMunieca" value={form.diametroMunieca} onChange={setField("diametroMunieca")} unit="cm" />
            </div>

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

            {/* Vista previa en tiempo real */}
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
              {history.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-700 text-sm">
                        {new Date(item.fecha).toLocaleDateString("es-AR")}
                      </span>
                      <span className="text-sm text-gray-500">{item.pesoKg} kg · {item.tallaCm} cm</span>
                      {item.imc !== null && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">IMC {item.imc.toFixed(1)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingId === item.id ? "..." : "Eliminar"}
                    </button>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {(() => {
                      const vals = [item.pliegueTriceps, item.pliegueSubescapular, item.pliegueSuprailiaco, item.pliegueAbdominal, item.pliegueMusloAnterior, item.plieguePantorrilla]
                      const suma = vals.every((v) => v !== null) ? Math.round(vals.reduce((a, b) => a + b!, 0) * 10) / 10 : null
                      return suma !== null ? <div><span className="text-gray-400 block text-xs">Suma 6 pliegues</span><p className="font-semibold text-orange-500">{suma} mm</p></div> : null
                    })()}
                    {item.masaMuscularKg !== null && <div><span className="text-gray-400 block text-xs">Masa muscular</span><p className="font-semibold text-blue-600">{item.masaMuscularKg} kg</p></div>}
                    <div><span className="text-gray-400 block text-xs">Peso</span><p className="font-semibold text-gray-700">{item.pesoKg} kg</p></div>
                    {item.masaGrasaKg !== null && <div><span className="text-gray-400 block text-xs">Tejido adiposo</span><p className="font-semibold text-rose-500">{item.masaGrasaKg} kg</p></div>}
                    {item.notas && <div className="col-span-full mt-1"><span className="text-gray-400 text-xs">Notas: </span><span className="text-gray-600 text-xs">{item.notas}</span></div>}
                  </div>
                </div>
              ))}
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
    </div>
  )
}
