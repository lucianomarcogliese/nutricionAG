"use client"

import { useEffect, useState } from "react"
import type { Permisos } from "@/lib/plan-seed"
import { useToast } from "@/components/ui/ToastProvider"

interface PlanConfig {
  id: string
  nombre: string
  displayName: string
  precioARS: number
  activo: boolean
  permisos: Permisos
}

const FEATURES: { key: keyof Permisos; label: string; icon: string }[] = [
  { key: "usarIA",                  label: "Asistente IA",               icon: "🤖" },
  { key: "consultasProfesionales",  label: "Consultas con profesionales", icon: "👨‍⚕️" },
  { key: "verRecetas",              label: "Recetas",                    icon: "🍳" },
  { key: "verDescuentos",           label: "Descuentos exclusivos",      icon: "🏷️" },
  { key: "verChat",                 label: "Chat comunitario",           icon: "💬" },
  { key: "verAntropometria",        label: "Antropometría",              icon: "📏" },
  { key: "verMensajesPrivados",     label: "Mensajes privados",          icon: "✉️" },
]

function LimitInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const isUnlimited = value === -1
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={isUnlimited}
            onChange={(e) => onChange(e.target.checked ? -1 : 1)}
            className="accent-emerald-600"
          />
          ∞
        </label>
        {isUnlimited ? (
          <span className="w-16 text-center text-sm font-semibold text-emerald-600">Ilimitado</span>
        ) : (
          <input
            type="number"
            min={1}
            value={value}
            onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}
      </div>
    </div>
  )
}

function PlanCard({ plan, onSaved }: { plan: PlanConfig; onSaved: (updated: PlanConfig) => void }) {
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState(plan.displayName)
  const [precioARS, setPrecioARS] = useState(plan.precioARS)
  const [activo, setActivo] = useState(plan.activo)
  const [permisos, setPermisos] = useState<Permisos>({ ...plan.permisos })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")

  function setPermiso<K extends keyof Permisos>(key: K, value: Permisos[K]) {
    setPermisos((p) => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setStatus("idle")
    try {
      const res = await fetch(`/api/admin/planes/${plan.nombre}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, precioARS, activo, permisos }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onSaved(data.plan)
      setStatus("ok")
      setTimeout(() => setStatus("idle"), 2500)
      toast({ message: `Plan ${plan.displayName} guardado correctamente`, type: "success" })
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
      toast({ message: "Error al guardar el plan. Intentá de nuevo.", type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const headerColor =
    plan.nombre === "PREMIUM"
      ? "from-violet-500 to-purple-600"
      : plan.nombre === "PRO"
      ? "from-emerald-500 to-emerald-600"
      : "from-gray-400 to-gray-500"

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-br ${headerColor} p-4`}>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-white/20 text-white placeholder-white/70 font-semibold text-lg rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1">
            <label className="text-white/70 text-xs mb-1 block">Precio ARS</label>
            <input
              type="number"
              min={0}
              value={precioARS}
              onChange={(e) => setPrecioARS(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-white/20 text-white font-semibold rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          <label className="flex flex-col items-center gap-1 cursor-pointer">
            <span className="text-white/70 text-xs">Activo</span>
            <div
              onClick={() => setActivo((v) => !v)}
              className={`w-10 h-6 rounded-full transition-colors relative ${activo ? "bg-white/80" : "bg-white/30"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                  activo ? "left-5 bg-emerald-600" : "left-1 bg-white/60"
                }`}
              />
            </div>
          </label>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* Límites numéricos */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Límites</p>
          <div className="divide-y divide-gray-100">
            <LimitInput
              label="Planes nutricionales"
              value={permisos.maxPlanes}
              onChange={(v) => setPermiso("maxPlanes", v)}
            />
            <LimitInput
              label="Rutinas"
              value={permisos.maxRutinas}
              onChange={(v) => setPermiso("maxRutinas", v)}
            />
          </div>
        </div>

        {/* Feature toggles */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Features</p>
          <div className="space-y-2">
            {FEATURES.map(({ key, label, icon }) => {
              const on = !!permisos[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPermiso(key as keyof Permisos, !on as Permisos[typeof key])}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    on
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-50 text-gray-400 border border-gray-100"
                  }`}
                >
                  <span>{icon}</span>
                  <span className="flex-1 text-left">{label}</span>
                  <span className={`text-xs font-semibold ${on ? "text-emerald-600" : "text-gray-400"}`}>
                    {on ? "ON" : "OFF"}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            status === "ok"
              ? "bg-emerald-100 text-emerald-700"
              : status === "error"
              ? "bg-red-100 text-red-600"
              : "bg-gray-900 hover:bg-gray-700 text-white disabled:opacity-50"
          }`}
        >
          {saving
            ? "Guardando..."
            : status === "ok"
            ? "✓ Guardado"
            : status === "error"
            ? "✗ Error al guardar"
            : "Guardar cambios"}
        </button>
      </div>
    </div>
  )
}

export function PlanesAdminTab() {
  const [planes, setPlanes] = useState<PlanConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState("")

  useEffect(() => {
    fetch("/api/admin/planes")
      .then((r) => r.json())
      .then((d) => setPlanes(d.planes ?? []))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(updated: PlanConfig) {
    setPlanes((prev) => prev.map((p) => (p.nombre === updated.nombre ? { ...p, ...updated } : p)))
  }

  async function handleSeed() {
    setSeeding(true)
    setSeedMsg("")
    try {
      const res = await fetch("/api/admin/seed-planes", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setSeedMsg("✓ Permisos actualizados en DB")
        const r2 = await fetch("/api/admin/planes")
        const d2 = await r2.json()
        setPlanes(d2.planes ?? [])
      } else {
        setSeedMsg(`✗ ${data.error}`)
      }
    } catch {
      setSeedMsg("✗ Error de red")
    } finally {
      setSeeding(false)
      setTimeout(() => setSeedMsg(""), 4000)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse h-96" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Planes y permisos</h2>
          <p className="text-sm text-gray-500 mt-0.5">Editá precios, límites y features por plan</p>
        </div>
        <div className="flex items-center gap-3">
          {seedMsg && (
            <span className={`text-sm font-medium ${seedMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
              {seedMsg}
            </span>
          )}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {seeding ? "Aplicando..." : "Aplicar defaults"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planes.map((p) => (
          <PlanCard key={p.nombre} plan={p} onSaved={handleSaved} />
        ))}
      </div>
    </div>
  )
}
