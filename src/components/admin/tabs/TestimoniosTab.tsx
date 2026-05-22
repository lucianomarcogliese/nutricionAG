"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

interface Testimonio {
  id: string
  nombre: string
  antesUrl: string
  despuesUrl: string
  kilos: number | null
  meses: number | null
  testimonio: string | null
  objetivo: string | null
  activo: boolean
  orden: number
}

const EMPTY_FORM = {
  nombre: "",
  kilos: "",
  meses: "",
  testimonio: "",
  objetivo: "",
}

export function TestimoniosTab() {
  const [lista, setLista] = useState<Testimonio[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [antesFile, setAntesFile] = useState<File | null>(null)
  const [despuesFile, setDespuesFile] = useState<File | null>(null)
  const [antesPreview, setAntesPreview] = useState<string | null>(null)
  const [despuesPreview, setDespuesPreview] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const antesRef = useRef<HTMLInputElement>(null)
  const despuesRef = useRef<HTMLInputElement>(null)

  function fetchLista() {
    setLoading(true)
    fetch("/api/admin/testimonios")
      .then((r) => r.json())
      .then((d) => setLista(d.testimonios ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLista() }, [])

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "antes" | "despues"
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    if (type === "antes") { setAntesFile(file); setAntesPreview(url) }
    else { setDespuesFile(file); setDespuesPreview(url) }
  }

  function openModal() {
    setForm(EMPTY_FORM)
    setAntesFile(null); setDespuesFile(null)
    setAntesPreview(null); setDespuesPreview(null)
    setFormError(null)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.nombre.trim()) return setFormError("El nombre es requerido.")
    if (!antesFile) return setFormError("La foto ANTES es requerida.")
    if (!despuesFile) return setFormError("La foto DESPUÉS es requerida.")

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("nombre", form.nombre.trim())
      fd.append("antesImage", antesFile)
      fd.append("despuesImage", despuesFile)
      if (form.kilos) fd.append("kilos", form.kilos)
      if (form.meses) fd.append("meses", form.meses)
      if (form.testimonio) fd.append("testimonio", form.testimonio)
      if (form.objetivo) fd.append("objetivo", form.objetivo)

      const res = await fetch("/api/admin/testimonios", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error ?? "Error al guardar."); return }
      setShowModal(false)
      fetchLista()
    } catch {
      setFormError("Error de conexión.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActivo(t: Testimonio) {
    await fetch(`/api/admin/testimonios/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !t.activo }),
    })
    fetchLista()
  }

  async function moverOrden(t: Testimonio, dir: "up" | "down") {
    const idx = lista.indexOf(t)
    const swap = dir === "up" ? lista[idx - 1] : lista[idx + 1]
    if (!swap) return

    await Promise.all([
      fetch(`/api/admin/testimonios/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orden: swap.orden }),
      }),
      fetch(`/api/admin/testimonios/${swap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orden: t.orden }),
      }),
    ])
    fetchLista()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/testimonios/${id}`, { method: "DELETE" })
    setConfirmDelete(null)
    fetchLista()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Testimonios</h2>
          <p className="text-sm text-gray-500 mt-0.5">Casos de antes y después visibles en la landing</p>
        </div>
        <button
          onClick={openModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          + Agregar testimonio
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse h-24" />
          ))}
        </div>
      )}

      {!loading && lista.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-gray-500 text-sm">No hay testimonios todavía.</p>
        </div>
      )}

      {!loading && lista.length > 0 && (
        <div className="space-y-3">
          {lista.map((t, i) => (
            <div
              key={t.id}
              className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${t.activo ? "border-gray-200" : "border-gray-100 opacity-60"}`}
            >
              {/* Fotos */}
              <div className="flex gap-2 shrink-0">
                <div className="relative">
                  <Image src={t.antesUrl} alt="Antes" width={64} height={80} className="object-cover rounded-lg" sizes="64px" />
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">Antes</span>
                </div>
                <div className="relative">
                  <Image src={t.despuesUrl} alt="Después" width={64} height={80} className="object-cover rounded-lg" sizes="64px" />
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">Después</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800">{t.nombre}</span>
                  {t.objetivo && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">{t.objetivo}</span>
                  )}
                  {!t.activo && (
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Oculto</span>
                  )}
                </div>
                {(t.kilos !== null || t.meses !== null) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.kilos !== null && `${t.kilos > 0 ? "+" : ""}${t.kilos} kg`}
                    {t.kilos !== null && t.meses !== null && " · "}
                    {t.meses !== null && `${t.meses} meses`}
                  </p>
                )}
                {t.testimonio && (
                  <p className="text-xs text-gray-400 mt-1 italic truncate">{t.testimonio}</p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moverOrden(t, "up")}
                  disabled={i === 0}
                  className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-xs"
                  title="Subir"
                >↑</button>
                <button
                  onClick={() => moverOrden(t, "down")}
                  disabled={i === lista.length - 1}
                  className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-xs"
                  title="Bajar"
                >↓</button>
                <button
                  onClick={() => toggleActivo(t)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
                    t.activo
                      ? "text-emerald-600 hover:bg-emerald-50"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                  title={t.activo ? "Ocultar" : "Mostrar"}
                >
                  {t.activo ? "👁" : "🙈"}
                </button>
                <button
                  onClick={() => setConfirmDelete(t.id)}
                  className="w-7 h-7 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center text-sm transition-colors"
                  title="Eliminar"
                >×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal agregar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Nuevo testimonio</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del paciente *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: María G."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Fotos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Foto ANTES *</label>
                  <div
                    onClick={() => antesRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl h-36 relative flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors overflow-hidden"
                  >
                    {antesPreview ? (
                      <Image unoptimized fill src={antesPreview} alt="Antes" className="object-cover rounded-xl" sizes="100vw" />
                    ) : (
                      <span className="text-gray-400 text-xs text-center px-2">Clic para subir</span>
                    )}
                  </div>
                  <input ref={antesRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "antes")} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Foto DESPUÉS *</label>
                  <div
                    onClick={() => despuesRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl h-36 relative flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors overflow-hidden"
                  >
                    {despuesPreview ? (
                      <Image unoptimized fill src={despuesPreview} alt="Después" className="object-cover rounded-xl" sizes="100vw" />
                    ) : (
                      <span className="text-gray-400 text-xs text-center px-2">Clic para subir</span>
                    )}
                  </div>
                  <input ref={despuesRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "despues")} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kg variación</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.kilos}
                    onChange={(e) => setForm((f) => ({ ...f, kilos: e.target.value }))}
                    placeholder="-12"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Negativo = perdió</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Meses</label>
                  <input
                    type="number"
                    min="1"
                    value={form.meses}
                    onChange={(e) => setForm((f) => ({ ...f, meses: e.target.value }))}
                    placeholder="3"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Objetivo */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Objetivo</label>
                <input
                  type="text"
                  value={form.objetivo}
                  onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value }))}
                  placeholder="Ej: Bajó de peso"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Testimonio */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Testimonio <span className="text-gray-400">({form.testimonio.length}/200)</span>
                </label>
                <textarea
                  value={form.testimonio}
                  maxLength={200}
                  rows={3}
                  onChange={(e) => setForm((f) => ({ ...f, testimonio: e.target.value }))}
                  placeholder="Descripción breve del proceso..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
                >
                  {saving ? "Subiendo..." : "Guardar"}
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
            <p className="text-gray-900 font-semibold mb-2">¿Eliminar testimonio?</p>
            <p className="text-sm text-gray-500 mb-5">Se eliminarán las imágenes de Cloudinary. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
