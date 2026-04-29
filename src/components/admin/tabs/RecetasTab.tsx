"use client"

import { useEffect, useRef, useState } from "react"

interface Ingrediente { nombre: string; cantidad: string; unidad: string }
interface Paso { orden: number; descripcion: string }

interface Receta {
  id: string
  titulo: string
  descripcion: string | null
  imagenUrl: string | null
  ingredientes: Ingrediente[]
  pasos: Paso[]
  calorias: number | null
  proteinas: number | null
  carbos: number | null
  grasas: number | null
  activo: boolean
  orden: number
}

const UNIDADES = ["g", "ml", "taza", "unidad", "cdita", "cda", "kg", "l"]

const EMPTY_FORM = {
  titulo: "",
  descripcion: "",
  calorias: "",
  proteinas: "",
  carbos: "",
  grasas: "",
}

const EMPTY_ING: Ingrediente = { nombre: "", cantidad: "", unidad: "g" }

export function RecetasTab() {
  const [lista, setLista] = useState<Receta[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [detalle, setDetalle] = useState<Receta | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([{ ...EMPTY_ING }])
  const [pasos, setPasos] = useState<string[]>([""])
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const imgRef = useRef<HTMLInputElement>(null)

  function fetchLista() {
    setLoading(true)
    fetch("/api/admin/recetas")
      .then((r) => r.json())
      .then((d) => setLista(d.recetas ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLista() }, [])

  function openModal() {
    setForm(EMPTY_FORM)
    setIngredientes([{ ...EMPTY_ING }])
    setPasos([""])
    setImagenFile(null)
    setImagenPreview(null)
    setFormError(null)
    setShowModal(true)
  }

  // ── Ingredientes ──────────────────────────────────────────────────────────
  function setIng(i: number, field: keyof Ingrediente, val: string) {
    setIngredientes((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  }
  function addIng() { setIngredientes((p) => [...p, { ...EMPTY_ING }]) }
  function removeIng(i: number) { setIngredientes((p) => p.filter((_, idx) => idx !== i)) }

  // ── Pasos ─────────────────────────────────────────────────────────────────
  function setPaso(i: number, val: string) {
    setPasos((p) => p.map((s, idx) => idx === i ? val : s))
  }
  function addPaso() { setPasos((p) => [...p, ""]) }
  function removePaso(i: number) { setPasos((p) => p.filter((_, idx) => idx !== i)) }
  function movePaso(i: number, dir: "up" | "down") {
    setPasos((p) => {
      const arr = [...p]
      const j = dir === "up" ? i - 1 : i + 1
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.titulo.trim()) return setFormError("El título es requerido.")
    if (ingredientes.every((i) => !i.nombre.trim())) return setFormError("Agregá al menos un ingrediente.")
    if (pasos.every((p) => !p.trim())) return setFormError("Agregá al menos un paso.")

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("titulo", form.titulo.trim())
      if (form.descripcion) fd.append("descripcion", form.descripcion.trim())
      fd.append("ingredientes", JSON.stringify(ingredientes.filter((i) => i.nombre.trim())))
      fd.append("pasos", JSON.stringify(
        pasos.filter((p) => p.trim()).map((desc, idx) => ({ orden: idx + 1, descripcion: desc.trim() }))
      ))
      if (form.calorias) fd.append("calorias", form.calorias)
      if (form.proteinas) fd.append("proteinas", form.proteinas)
      if (form.carbos) fd.append("carbos", form.carbos)
      if (form.grasas) fd.append("grasas", form.grasas)
      if (imagenFile) fd.append("imagen", imagenFile)

      const res = await fetch("/api/admin/recetas", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setFormError(`${data.error ?? "Error al guardar."}${data.detalle ? ` — ${data.detalle}` : ""}`); return }
      setShowModal(false)
      fetchLista()
    } catch {
      setFormError("Error de conexión.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActivo(r: Receta) {
    await fetch(`/api/admin/recetas/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !r.activo }),
    })
    fetchLista()
  }

  async function moverOrden(r: Receta, dir: "up" | "down") {
    const idx = lista.indexOf(r)
    const swap = dir === "up" ? lista[idx - 1] : lista[idx + 1]
    if (!swap) return
    await Promise.all([
      fetch(`/api/admin/recetas/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orden: swap.orden }) }),
      fetch(`/api/admin/recetas/${swap.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orden: r.orden }) }),
    ])
    fetchLista()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/recetas/${id}`, { method: "DELETE" })
    setConfirmDelete(null)
    fetchLista()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recetas</h2>
          <p className="text-sm text-gray-500 mt-0.5">Recetas disponibles para los usuarios</p>
        </div>
        <button onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
          + Nueva receta
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse h-20" />)}
        </div>
      )}

      {!loading && lista.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-4xl mb-3">🍳</p>
          <p className="text-gray-500 text-sm">No hay recetas todavía.</p>
        </div>
      )}

      {!loading && lista.length > 0 && (
        <div className="space-y-3">
          {lista.map((r, i) => (
            <div key={r.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${r.activo ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
              {/* Imagen — clic abre detalle */}
              <div
                className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-2xl cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setDetalle(r)}
              >
                {r.imagenUrl
                  ? <img src={r.imagenUrl} alt={r.titulo} className="w-full h-full object-cover" />
                  : "🍽️"}
              </div>

              {/* Info — clic abre detalle */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetalle(r)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800">{r.titulo}</span>
                  {!r.activo && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Oculta</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {r.calorias != null && <span className="text-xs text-gray-500">{r.calorias} kcal</span>}
                  {r.proteinas != null && <span className="text-xs text-gray-400">P {r.proteinas}g</span>}
                  {r.carbos != null && <span className="text-xs text-gray-400">C {r.carbos}g</span>}
                  {r.grasas != null && <span className="text-xs text-gray-400">G {r.grasas}g</span>}
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{(r.ingredientes as Ingrediente[]).length} ingredientes · {(r.pasos as Paso[]).length} pasos</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moverOrden(r, "up")} disabled={i === 0} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-xs">↑</button>
                <button onClick={() => moverOrden(r, "down")} disabled={i === lista.length - 1} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-xs">↓</button>
                <button onClick={() => toggleActivo(r)} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${r.activo ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`} title={r.activo ? "Ocultar" : "Mostrar"}>
                  {r.activo ? "👁" : "🙈"}
                </button>
                <button onClick={() => setConfirmDelete(r.id)} className="w-7 h-7 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center text-sm transition-colors">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva receta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">Nueva receta</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Imagen */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Imagen (opcional)</label>
                <div onClick={() => imgRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors overflow-hidden">
                  {imagenPreview
                    ? <img src={imagenPreview} alt="preview" className="w-full h-full object-cover rounded-xl" />
                    : <span className="text-gray-400 text-sm">Clic para subir imagen</span>}
                </div>
                <input ref={imgRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) { setImagenFile(f); setImagenPreview(URL.createObjectURL(f)) }
                  }} />
              </div>

              {/* Título + descripción */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
                  <input type="text" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Bowl de pollo y vegetales" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} rows={2} placeholder="Descripción breve de la receta..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                </div>
              </div>

              {/* Macros */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Información nutricional</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: "calorias", label: "Calorías (kcal)" },
                    { key: "proteinas", label: "Proteínas (g)" },
                    { key: "carbos", label: "Carbos (g)" },
                    { key: "grasas", label: "Grasas (g)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={(form as any)[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredientes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Ingredientes *</label>
                  <button type="button" onClick={addIng} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Agregar</button>
                </div>
                <div className="space-y-2">
                  {ingredientes.map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={ing.nombre}
                        onChange={(e) => setIng(i, "nombre", e.target.value)}
                        placeholder="Ingrediente"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <input
                        type="text"
                        value={ing.cantidad}
                        onChange={(e) => setIng(i, "cantidad", e.target.value)}
                        placeholder="Cant."
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <select
                        value={ing.unidad}
                        onChange={(e) => setIng(i, "unidad", e.target.value)}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                      >
                        {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                      {ingredientes.length > 1 && (
                        <button type="button" onClick={() => removeIng(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pasos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Pasos de preparación *</label>
                  <button type="button" onClick={addPaso} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Agregar</button>
                </div>
                <div className="space-y-2">
                  {pasos.map((paso, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="w-6 h-7 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0 mt-1">{i + 1}</span>
                      <textarea
                        value={paso}
                        onChange={(e) => setPaso(i, e.target.value)}
                        rows={2}
                        placeholder={`Paso ${i + 1}...`}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                      />
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button type="button" onClick={() => movePaso(i, "up")} disabled={i === 0} className="w-6 h-6 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-xs">↑</button>
                        <button type="button" onClick={() => movePaso(i, "down")} disabled={i === pasos.length - 1} className="w-6 h-6 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-xs">↓</button>
                        {pasos.length > 1 && (
                          <button type="button" onClick={() => removePaso(i)} className="w-6 h-6 rounded text-gray-300 hover:text-red-400 flex items-center justify-center text-sm">×</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors">
                  {saving ? "Guardando..." : "Guardar receta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <p className="text-gray-900 font-semibold mb-2">¿Eliminar receta?</p>
            <p className="text-sm text-gray-500 mb-5">Se eliminará la imagen de Cloudinary. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg py-2 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {detalle.imagenUrl && (
              <img src={detalle.imagenUrl} alt={detalle.titulo} className="w-full h-52 object-cover rounded-t-2xl" />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{detalle.titulo}</h3>
                <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0">×</button>
              </div>

              {detalle.descripcion && (
                <p className="text-sm text-gray-500 mb-4">{detalle.descripcion}</p>
              )}

              {/* Macros */}
              {(detalle.calorias != null || detalle.proteinas != null || detalle.carbos != null || detalle.grasas != null) && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {detalle.calorias != null && <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 font-medium">🔥 {detalle.calorias} kcal</span>}
                  {detalle.proteinas != null && <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">P {detalle.proteinas}g</span>}
                  {detalle.carbos != null && <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 font-medium">C {detalle.carbos}g</span>}
                  {detalle.grasas != null && <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 font-medium">G {detalle.grasas}g</span>}
                </div>
              )}

              {/* Ingredientes */}
              {(detalle.ingredientes as Ingrediente[]).length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ingredientes</h4>
                  <ul className="space-y-1.5">
                    {(detalle.ingredientes as Ingrediente[]).map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="font-medium">{ing.nombre}</span>
                        {ing.cantidad && <span className="text-gray-400">{ing.cantidad} {ing.unidad}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pasos */}
              {(detalle.pasos as Paso[]).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Preparación</h4>
                  <ol className="space-y-3">
                    {[...(detalle.pasos as Paso[])].sort((a, b) => a.orden - b.orden).map((paso, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {paso.orden}
                        </span>
                        <p className="text-sm text-gray-600 leading-relaxed">{paso.descripcion}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
