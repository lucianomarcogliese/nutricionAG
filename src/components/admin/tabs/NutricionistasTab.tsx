"use client"

import { useEffect, useState } from "react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

interface NutriUser {
  id: string
  name: string | null
  email: string | null
  role: string
}

interface Nutritionist {
  id: string
  nombre: string
  matricula: string
  especialidades: string[]
  color: string
  activo: boolean
  createdAt: string
  user: NutriUser | null
}

interface UserResult {
  id: string
  name: string | null
  email: string | null
  role: string
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"]

function NutriAvatar({ nombre, color }: { nombre: string; color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
      style={{ backgroundColor: color }}
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

function VinculadoBadge({ user, nutriId, onUnlink }: { user: NutriUser; nutriId: string; onUnlink: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleUnlink() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/nutritionists/${nutriId}/unlink`, { method: "DELETE" })
      if (res.ok) onUnlink(nutriId)
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
        ✓ Vinculado
      </span>
      <span className="text-xs text-gray-600 truncate max-w-[140px]">{user.name ?? user.email}</span>
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
          Desvincular
        </button>
      ) : (
        <span className="flex items-center gap-1">
          <button onClick={handleUnlink} disabled={loading} className="text-xs text-red-600 font-semibold hover:text-red-700">
            {loading ? "..." : "Confirmar"}
          </button>
          <button onClick={() => setConfirming(false)} className="text-xs text-gray-400">Cancelar</button>
        </span>
      )}
    </div>
  )
}

function LinkModal({
  nutriId,
  onLinked,
  onClose,
}: {
  nutriId: string
  onLinked: (nutriId: string, user: NutriUser) => void
  onClose: () => void
}) {
  const [busqueda, setBusqueda] = useState("")
  const [usuarios, setUsuarios] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState<string | null>(null)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    setLoading(true)
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsuarios((d.users ?? []).filter((u: UserResult) => u.role === "USER")))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = busqueda.trim()
    ? usuarios.filter(
        (u) =>
          u.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
          u.email?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : usuarios

  async function handleLink(userId: string) {
    setLinking(userId)
    setMsg("")
    try {
      const res = await fetch(`/api/admin/nutritionists/${nutriId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error ?? "Error"); return }
      onLinked(nutriId, data.nutritionist.user)
      onClose()
    } catch {
      setMsg("Error de red")
    } finally {
      setLinking(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Vincular usuario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoFocus
        />

        {msg && <p className="text-sm text-red-500 mb-3">{msg}</p>}

        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {loading && <p className="text-sm text-gray-400 py-4 text-center">Cargando...</p>}
          {!loading && filtrados.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">Sin usuarios disponibles</p>
          )}
          {filtrados.map((u) => (
            <button
              key={u.id}
              onClick={() => handleLink(u.id)}
              disabled={linking === u.id}
              className="w-full flex items-center gap-3 px-2 py-3 hover:bg-gray-50 text-left transition-colors disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">
                {(u.name ?? u.email ?? "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{u.name ?? "Sin nombre"}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              {linking === u.id && <span className="text-xs text-emerald-600">Vinculando...</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function NuevoModal({ onCreated, onClose }: { onCreated: (n: Nutritionist) => void; onClose: () => void }) {
  const [nombre, setNombre] = useState("")
  const [matricula, setMatricula] = useState("")
  const [espec, setEspec] = useState("")
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !matricula.trim()) { setErr("Nombre y matrícula son requeridos"); return }
    setSaving(true)
    setErr("")
    try {
      const res = await fetch("/api/admin/nutritionists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          matricula: matricula.trim(),
          especialidades: espec.split(",").map((s) => s.trim()).filter(Boolean),
          color,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? "Error"); return }
      onCreated(data.nutritionist)
      onClose()
    } catch {
      setErr("Error de red")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Nuevo nutricionista</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre completo *</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Matrícula *</label>
            <input value={matricula} onChange={(e) => setMatricula(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Especialidades (separadas por coma)</label>
            <input value={espec} onChange={(e) => setEspec(e.target.value)} placeholder="Nutrición clínica, Deportiva..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Color de avatar</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>

        {err && <p className="text-sm text-red-500 mt-3">{err}</p>}

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? "Guardando..." : "Crear nutricionista"}
          </button>
        </div>
      </form>
    </div>
  )
}

export function NutricionistasTab() {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [nutris, setNutris] = useState<Nutritionist[]>([])
  const [loading, setLoading] = useState(true)
  const [linkModal, setLinkModal] = useState<string | null>(null)
  const [showNuevo, setShowNuevo] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/nutritionists")
      .then((r) => r.json())
      .then((d) => setNutris(d.nutritionists ?? []))
      .finally(() => setLoading(false))
  }, [])

  function handleLinked(nutriId: string, user: NutriUser) {
    setNutris((prev) => prev.map((n) => n.id === nutriId ? { ...n, user } : n))
  }

  function handleUnlinked(nutriId: string) {
    setNutris((prev) => prev.map((n) => n.id === nutriId ? { ...n, user: null } : n))
  }

  async function handleToggle(id: string) {
    setToggling(id)
    try {
      const res = await fetch(`/api/admin/nutritionists/${id}/toggle`, { method: "PATCH" })
      if (res.ok) {
        const data = await res.json()
        setNutris((prev) => prev.map((n) => n.id === id ? { ...n, activo: data.nutritionist.activo } : n))
      }
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete(id: string) {
    setPendingDeleteId(null)
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/nutritionists/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? "Error al eliminar"); return }
      setNutris((prev) => prev.filter((n) => n.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nutricionistas 👨‍⚕️</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestioná el equipo y sus cuentas de acceso</p>
        </div>
        <button
          onClick={() => setShowNuevo(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse h-40" />)}
        </div>
      )}

      {!loading && nutris.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">👨‍⚕️</div>
          <p className="text-gray-500 font-medium">No hay nutricionistas registrados</p>
          <button onClick={() => setShowNuevo(true)} className="mt-4 text-emerald-600 text-sm font-medium hover:text-emerald-700">
            Crear el primero
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nutris.map((n) => (
          <div key={n.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <NutriAvatar nombre={n.nombre} color={n.color} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{n.nombre}</span>
                  <span className="text-xs text-gray-400">Mat. {n.matricula}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${n.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {n.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {n.especialidades.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {n.especialidades.map((e) => (
                      <span key={e} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                )}

                <div className="mt-2">
                  {n.user ? (
                    <VinculadoBadge user={n.user} nutriId={n.id} onUnlink={handleUnlinked} />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                        Sin cuenta
                      </span>
                      <button
                        onClick={() => setLinkModal(n.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                      >
                        Vincular usuario
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(n.id)}
                  disabled={toggling === n.id}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {toggling === n.id ? "..." : n.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => setPendingDeleteId(n.id)}
                  disabled={deleting === n.id}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting === n.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {linkModal && (
        <LinkModal
          nutriId={linkModal}
          onLinked={handleLinked}
          onClose={() => setLinkModal(null)}
        />
      )}

      {showNuevo && (
        <NuevoModal
          onCreated={(n) => setNutris((prev) => [n, ...prev])}
          onClose={() => setShowNuevo(false)}
        />
      )}

      {pendingDeleteId && (
        <ConfirmDialog
          message="¿Eliminar este nutricionista? Esta acción no se puede deshacer."
          onConfirm={() => handleDelete(pendingDeleteId)}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  )
}
