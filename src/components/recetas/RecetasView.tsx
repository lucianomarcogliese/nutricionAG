"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"

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
  isFavorito: boolean
}

type Tab = "todas" | "favoritas"

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {label} {value}
    </span>
  )
}

function RecetaModal({ receta, onClose, onToggleFav }: { receta: Receta; onClose: () => void; onToggleFav: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={receta.titulo} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {receta.imagenUrl && (
          <div className="relative h-52">
            <Image fill src={receta.imagenUrl} alt={receta.titulo} className="object-cover rounded-t-2xl" sizes="(max-width: 640px) 100vw, 512px" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{receta.titulo}</h2>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => onToggleFav(receta.id)} className="text-2xl leading-none hover:scale-110 transition-transform">
                {receta.isFavorito ? "❤️" : "🤍"}
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
          </div>

          {receta.descripcion && <p className="text-sm text-gray-500 mb-4">{receta.descripcion}</p>}

          {/* Macros */}
          {(receta.calorias != null || receta.proteinas != null) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {receta.calorias != null && <MacroPill label="🔥" value={`${receta.calorias} kcal`} color="bg-orange-50 text-orange-600" />}
              {receta.proteinas != null && <MacroPill label="P" value={`${receta.proteinas}g`} color="bg-blue-50 text-blue-600" />}
              {receta.carbos != null && <MacroPill label="C" value={`${receta.carbos}g`} color="bg-yellow-50 text-yellow-700" />}
              {receta.grasas != null && <MacroPill label="G" value={`${receta.grasas}g`} color="bg-purple-50 text-purple-600" />}
            </div>
          )}

          {/* Ingredientes */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Ingredientes</h3>
            <ul className="space-y-1.5">
              {receta.ingredientes.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-medium">{ing.nombre}</span>
                  {ing.cantidad && <span className="text-gray-400">{ing.cantidad} {ing.unidad}</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Pasos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Preparación</h3>
            <ol className="space-y-3">
              {[...receta.pasos].sort((a, b) => a.orden - b.orden).map((paso, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {paso.orden}
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed">{paso.descripcion}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RecetasView() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState("")
  const [tab, setTab] = useState<Tab>("todas")
  const [selected, setSelected] = useState<Receta | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchRecetas = useCallback((query: string) => {
    setLoading(true)
    const qs = query ? `?buscar=${encodeURIComponent(query)}` : ""
    fetch(`/api/recetas${qs}`)
      .then((r) => r.json())
      .then((d) => setRecetas(d.recetas ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchRecetas("") }, [fetchRecetas])

  function handleBuscar(val: string) {
    setBuscar(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchRecetas(val), 300)
  }

  function toggleFav(id: string) {
    // Optimistic update
    setRecetas((prev) =>
      prev.map((r) => r.id === id ? { ...r, isFavorito: !r.isFavorito } : r)
    )
    if (selected?.id === id) {
      setSelected((s) => s ? { ...s, isFavorito: !s.isFavorito } : s)
    }

    fetch(`/api/recetas/${id}/favorito`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        // Sync con respuesta real si difiere
        setRecetas((prev) =>
          prev.map((r) => r.id === id ? { ...r, isFavorito: data.isFavorito } : r)
        )
        if (selected?.id === id) {
          setSelected((s) => s ? { ...s, isFavorito: data.isFavorito } : s)
        }
      })
      .catch(() => {
        // Revert on error
        setRecetas((prev) =>
          prev.map((r) => r.id === id ? { ...r, isFavorito: !r.isFavorito } : r)
        )
      })
  }

  const visible = tab === "todas" ? recetas : recetas.filter((r) => r.isFavorito)

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
    }`

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recetas</h1>
        <p className="text-sm text-gray-500 mt-1">Recetas saludables para tu día a día</p>
      </div>

      {/* Buscador + tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={buscar}
          onChange={(e) => handleBuscar(e.target.value)}
          placeholder="Buscar receta..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button className={tabCls("todas")} onClick={() => setTab("todas")}>Todas</button>
          <button className={tabCls("favoritas")} onClick={() => setTab("favoritas")}>❤️ Favoritas</button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse h-64" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && visible.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">{tab === "favoritas" ? "🤍" : "🍽️"}</div>
          <p className="text-gray-500 text-sm">
            {tab === "favoritas"
              ? "Todavía no guardaste recetas favoritas."
              : buscar
              ? `No se encontraron recetas con "${buscar}".`
              : "No hay recetas disponibles todavía."}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setSelected(r)}
            >
              {/* Imagen */}
              <div className="relative h-44 bg-gray-100 overflow-hidden">
                {r.imagenUrl
                  ? <Image fill src={r.imagenUrl} alt={r.titulo} className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                }
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFav(r.id) }}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform text-base"
                  title={r.isFavorito ? "Quitar favorito" : "Agregar favorito"}
                >
                  {r.isFavorito ? "❤️" : "🤍"}
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">{r.titulo}</h3>

                {(r.calorias != null || r.proteinas != null || r.carbos != null || r.grasas != null) && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.calorias != null && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">🔥 {r.calorias} kcal</span>
                    )}
                    {r.proteinas != null && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">P {r.proteinas}g</span>
                    )}
                    {r.carbos != null && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">C {r.carbos}g</span>
                    )}
                    {r.grasas != null && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">G {r.grasas}g</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <RecetaModal
          receta={selected}
          onClose={() => setSelected(null)}
          onToggleFav={toggleFav}
        />
      )}
    </div>
  )
}
