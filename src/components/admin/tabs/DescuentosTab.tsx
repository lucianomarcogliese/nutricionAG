"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

interface Descuento {
  id: string
  titulo: string
  descripcion: string
  marca: string
  logoUrl: string | null
  imagenUrl: string | null
  codigo: string | null
  porcentaje: number | null
  link: string | null
  categoria: string
  planMinimo: string
  activo: boolean
  fechaVencimiento: string | null
  orden: number
}

const CATEGORIAS_DEFAULT = ["Suplementos", "Ropa deportiva", "Equipamiento", "Alimentos", "Tecnología", "Bienestar", "Otro"]

const EMPTY_FORM = {
  titulo: "", descripcion: "", marca: "", codigo: "", porcentaje: "",
  link: "", categoria: "", nuevaCategoria: "", planMinimo: "PRO", fechaVencimiento: "",
}

export function DescuentosTab() {
  const [lista, setLista] = useState<Descuento[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const logoRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)

  function fetchLista() {
    setLoading(true)
    fetch("/api/admin/descuentos")
      .then((r) => r.json())
      .then((d) => setLista(d.descuentos ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLista() }, [])

  function openModal() {
    setForm(EMPTY_FORM)
    setLogoFile(null); setImagenFile(null)
    setLogoPreview(null); setImagenPreview(null)
    setFormError(null)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const categoria = form.categoria === "__nueva__" ? form.nuevaCategoria.trim() : form.categoria
    if (!form.titulo.trim()) return setFormError("El título es requerido.")
    if (!form.descripcion.trim()) return setFormError("La descripción es requerida.")
    if (!form.marca.trim()) return setFormError("La marca es requerida.")
    if (!categoria) return setFormError("La categoría es requerida.")

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("titulo", form.titulo.trim())
      fd.append("descripcion", form.descripcion.trim())
      fd.append("marca", form.marca.trim())
      fd.append("categoria", categoria)
      fd.append("planMinimo", form.planMinimo)
      if (form.codigo) fd.append("codigo", form.codigo.trim())
      if (form.porcentaje) fd.append("porcentaje", form.porcentaje)
      if (form.link) fd.append("link", form.link.trim())
      if (form.fechaVencimiento) fd.append("fechaVencimiento", form.fechaVencimiento)
      if (logoFile) fd.append("logo", logoFile)
      if (imagenFile) fd.append("imagen", imagenFile)

      const res = await fetch("/api/admin/descuentos", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setFormError(`${data.error ?? "Error"}${data.detalle ? ` — ${data.detalle}` : ""}`); return }
      setShowModal(false)
      fetchLista()
    } catch {
      setFormError("Error de conexión.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActivo(d: Descuento) {
    await fetch(`/api/admin/descuentos/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !d.activo }),
    })
    fetchLista()
  }

  async function moverOrden(d: Descuento, dir: "up" | "down") {
    const idx = lista.indexOf(d)
    const swap = dir === "up" ? lista[idx - 1] : lista[idx + 1]
    if (!swap) return
    await Promise.all([
      fetch(`/api/admin/descuentos/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orden: swap.orden }) }),
      fetch(`/api/admin/descuentos/${swap.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orden: d.orden }) }),
    ])
    fetchLista()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/descuentos/${id}`, { method: "DELETE" })
    setConfirmDelete(null)
    fetchLista()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Descuentos exclusivos</h2>
          <p className="text-sm text-gray-500 mt-0.5">Beneficios para usuarios PRO y PREMIUM</p>
        </div>
        <button onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
          + Nuevo descuento
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse h-20" />)}
        </div>
      )}

      {!loading && lista.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-gray-500 text-sm">No hay descuentos todavía.</p>
        </div>
      )}

      {!loading && lista.length > 0 && (
        <div className="space-y-3">
          {lista.map((d, i) => (
            <div key={d.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${d.activo ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
              {/* Logo */}
              <div className="shrink-0 relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400">
                {d.logoUrl
                  ? <Image fill src={d.logoUrl} alt={d.marca} className="object-contain p-1" sizes="48px" />
                  : d.marca.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800">{d.titulo}</span>
                  <span className="text-xs text-gray-400">{d.marca}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{d.categoria}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${d.planMinimo === "PREMIUM" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {d.planMinimo}
                  </span>
                  {d.porcentaje != null && (
                    <span className="text-xs bg-emerald-600 text-white rounded-full px-2 py-0.5 font-bold">{d.porcentaje}% OFF</span>
                  )}
                  {d.codigo && (
                    <span className="text-xs font-mono bg-gray-50 border border-gray-200 text-gray-600 rounded px-1.5 py-0.5">{d.codigo}</span>
                  )}
                  {!d.activo && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Oculto</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{d.descripcion}</p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moverOrden(d, "up")} disabled={i === 0} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-xs">↑</button>
                <button onClick={() => moverOrden(d, "down")} disabled={i === lista.length - 1} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-xs">↓</button>
                <button onClick={() => toggleActivo(d)} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${d.activo ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`} title={d.activo ? "Ocultar" : "Mostrar"}>
                  {d.activo ? "👁" : "🙈"}
                </button>
                <button onClick={() => setConfirmDelete(d.id)} className="w-7 h-7 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center text-sm transition-colors">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo descuento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">Nuevo descuento</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Imágenes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Logo de marca</label>
                  <div onClick={() => logoRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl h-24 relative flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors overflow-hidden">
                    {logoPreview
                      ? <Image unoptimized fill src={logoPreview} alt="logo" className="object-contain p-2" sizes="100vw" />
                      : <span className="text-gray-400 text-xs text-center px-2">Logo</span>}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) } }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Imagen principal</label>
                  <div onClick={() => imgRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl h-24 relative flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors overflow-hidden">
                    {imagenPreview
                      ? <Image unoptimized fill src={imagenPreview} alt="imagen" className="object-cover rounded-xl" sizes="100vw" />
                      : <span className="text-gray-400 text-xs text-center px-2">Imagen</span>}
                  </div>
                  <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImagenFile(f); setImagenPreview(URL.createObjectURL(f)) } }} />
                </div>
              </div>

              {/* Campos principales */}
              {(
                [
                  { key: "titulo", label: "Título *", placeholder: "Ej: 20% en suplementos" },
                  { key: "marca", label: "Marca *", placeholder: "Ej: MyProtein" },
                  { key: "descripcion", label: "Descripción *", placeholder: "Descripción del beneficio..." },
                ] as Array<{ key: keyof typeof EMPTY_FORM; label: string; placeholder: string }>
              ).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  {key === "descripcion"
                    ? <textarea value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} rows={2} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                    : <input type="text" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  }
                </div>
              ))}

              {/* Código + Porcentaje */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código de descuento</label>
                  <input type="text" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="NUTRI20" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">% Descuento</label>
                  <input type="number" min="1" max="100" value={form.porcentaje} onChange={(e) => setForm((f) => ({ ...f, porcentaje: e.target.value }))} placeholder="20" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>

              {/* Link + Categoría */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Link externo</label>
                <input type="url" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoría *</label>
                <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                  <option value="">Seleccionar...</option>
                  {CATEGORIAS_DEFAULT.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__nueva__">+ Escribir nueva categoría</option>
                </select>
                {form.categoria === "__nueva__" && (
                  <input type="text" value={form.nuevaCategoria} onChange={(e) => setForm((f) => ({ ...f, nuevaCategoria: e.target.value }))} placeholder="Nueva categoría..." className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                )}
              </div>

              {/* Plan mínimo + Vencimiento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Plan mínimo</label>
                  <select value={form.planMinimo} onChange={(e) => setForm((f) => ({ ...f, planMinimo: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                    <option value="PRO">PRO</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha vencimiento</label>
                  <input type="date" value={form.fechaVencimiento} onChange={(e) => setForm((f) => ({ ...f, fechaVencimiento: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors">
                  {saving ? "Guardando..." : "Guardar"}
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
            <p className="text-gray-900 font-semibold mb-2">¿Eliminar descuento?</p>
            <p className="text-sm text-gray-500 mb-5">Se eliminarán las imágenes de Cloudinary. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg py-2 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
