"use client"

import { useEffect, useState, useCallback } from "react"

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
  fechaVencimiento: string | null
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function CopyButton({ codigo }: { codigo: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(codigo).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
      <span className="font-mono text-sm font-semibold text-gray-700 tracking-wider">{codigo}</span>
      <button
        onClick={handleCopy}
        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium shrink-0 transition-colors"
      >
        {copied ? "✓ Copiado" : "Copiar"}
      </button>
    </div>
  )
}

export function DescuentosView() {
  const [descuentos, setDescuentos] = useState<Descuento[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [catActiva, setCatActiva] = useState<string>("Todos")
  const [loading, setLoading] = useState(true)

  const fetchDescuentos = useCallback((cat: string) => {
    setLoading(true)
    const qs = cat !== "Todos" ? `?categoria=${encodeURIComponent(cat)}` : ""
    fetch(`/api/descuentos${qs}`)
      .then((r) => r.json())
      .then((d) => setDescuentos(d.descuentos ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/descuentos/categorias")
      .then((r) => r.json())
      .then((d) => setCategorias(d.categorias ?? []))
    fetchDescuentos("Todos")
  }, [fetchDescuentos])

  function handleCategoria(cat: string) {
    setCatActiva(cat)
    fetchDescuentos(cat)
  }

  const pillCls = (cat: string) =>
    `px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
      catActiva === cat
        ? "bg-emerald-600 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Descuentos Exclusivos 🏷️</h1>
        <p className="text-sm text-gray-500 mt-1">Beneficios exclusivos para miembros</p>
      </div>

      {/* Filtro categorías */}
      {categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button className={pillCls("Todos")} onClick={() => handleCategoria("Todos")}>Todos</button>
          {categorias.map((c) => (
            <button key={c} className={pillCls(c)} onClick={() => handleCategoria(c)}>{c}</button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse h-72" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && descuentos.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🏷️</div>
          <p className="text-gray-600 font-medium">Próximamente nuevos descuentos</p>
          <p className="text-gray-400 text-sm mt-1">Estamos sumando nuevos beneficios para vos.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && descuentos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {descuentos.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              {/* Imagen principal */}
              {d.imagenUrl ? (
                <div className="h-40 overflow-hidden">
                  <img src={d.imagenUrl} alt={d.titulo} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  <span className="text-5xl font-bold text-emerald-200">{d.marca.charAt(0)}</span>
                </div>
              )}

              <div className="p-4 flex flex-col flex-1">
                {/* Logo + marca + categoría */}
                <div className="flex items-center gap-2 mb-3">
                  {d.logoUrl ? (
                    <img src={d.logoUrl} alt={d.marca} className="w-8 h-8 rounded-lg object-contain bg-gray-50 p-0.5 border border-gray-100" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      {d.marca.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-gray-700">{d.marca}</span>
                  <span className="ml-auto text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{d.categoria}</span>
                </div>

                {/* % OFF badge */}
                {d.porcentaje != null && (
                  <div className="inline-flex mb-2">
                    <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {d.porcentaje}% OFF
                    </span>
                  </div>
                )}

                {/* Título + descripción */}
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{d.titulo}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">{d.descripcion}</p>

                {/* Código */}
                {d.codigo && (
                  <div className="mb-3">
                    <CopyButton codigo={d.codigo} />
                  </div>
                )}

                {/* Vencimiento */}
                {d.fechaVencimiento && (
                  <p className="text-xs text-amber-600 mb-3">
                    ⏰ Vence: {formatFecha(d.fechaVencimiento)}
                  </p>
                )}

                {/* CTA */}
                {d.link && (
                  <a
                    href={d.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl py-2.5 transition-colors mt-auto"
                  >
                    Ver oferta →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
