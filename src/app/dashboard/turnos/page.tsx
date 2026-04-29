"use client"

import { useEffect, useState } from "react"

interface Nutricionista {
  id: string
  nombre: string
  color: string
  matricula: string
}

interface Turno {
  id: string
  fecha: string
  duracion: number
  tipo: string
  estado: string
  notas: string | null
  nutricionista: Nutricionista | null
}

const TIPO_LABELS: Record<string, string> = {
  CONSULTA_NUTRICIONAL: "Consulta nutricional",
  SEGUIMIENTO: "Seguimiento",
  ANTROPOMETRIA: "Antropometría",
  CONSULTA_DEPORTIVA: "Consulta deportiva",
}

const ESTADO_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  PENDIENTE:   { label: "Pendiente",   cls: "bg-amber-100 text-amber-700",   icon: "⏳" },
  CONFIRMADO:  { label: "Confirmado",  cls: "bg-emerald-100 text-emerald-700", icon: "✅" },
  CANCELADO:   { label: "Cancelado",   cls: "bg-red-100 text-red-600",       icon: "❌" },
  COMPLETADO:  { label: "Completado",  cls: "bg-gray-100 text-gray-600",     icon: "✔️" },
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatHora(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

function isPast(iso: string) {
  return new Date(iso) < new Date()
}

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/turnos")
      .then((r) => r.json())
      .then((data) => {
        if (data.appointments) setTurnos(data.appointments)
        else setError("No se pudieron cargar los turnos.")
      })
      .catch(() => setError("Error de conexión."))
      .finally(() => setLoading(false))
  }, [])

  const proximos = turnos.filter((t) => !isPast(t.fecha) && t.estado !== "CANCELADO")
  const pasados  = turnos.filter((t) => isPast(t.fecha) || t.estado === "CANCELADO")

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mis turnos</h1>
        <p className="text-sm text-gray-500 mt-1">Tus consultas con el equipo de nutrición</p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && turnos.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-gray-500 text-sm">Todavía no tenés turnos agendados.</p>
          <p className="text-gray-400 text-xs mt-1">Tu nutricionista los verás reflejados aquí.</p>
        </div>
      )}

      {!loading && !error && proximos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Próximos
          </h2>
          <div className="space-y-3">
            {proximos.map((t) => (
              <TurnoCard key={t.id} turno={t} />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && pasados.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Historial
          </h2>
          <div className="space-y-3 opacity-75">
            {pasados.map((t) => (
              <TurnoCard key={t.id} turno={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TurnoCard({ turno }: { turno: Turno }) {
  const estado = ESTADO_CONFIG[turno.estado] ?? { label: turno.estado, cls: "bg-gray-100 text-gray-600", icon: "•" }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${estado.cls}`}>
              {estado.icon} {estado.label}
            </span>
            <span className="text-xs text-gray-400">
              {TIPO_LABELS[turno.tipo] ?? turno.tipo}
            </span>
          </div>

          <p className="text-sm font-semibold text-gray-800 capitalize">
            {formatFecha(turno.fecha)}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatHora(turno.fecha)} · {turno.duracion} min
          </p>
        </div>

        {turno.nutricionista && (
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: turno.nutricionista.color }}
            >
              {turno.nutricionista.nombre.charAt(0)}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-gray-700">{turno.nutricionista.nombre}</p>
              <p className="text-xs text-gray-400">MN {turno.nutricionista.matricula}</p>
            </div>
          </div>
        )}
      </div>

      {turno.notas && (
        <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          {turno.notas}
        </p>
      )}
    </div>
  )
}
