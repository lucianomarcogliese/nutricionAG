"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { getPusherClient } from "@/lib/pusher-client"

interface Conversacion {
  id: string
  profileId: string
  nutricionistaId: string
  ultimoMensaje: string
  createdAt: string
  usuarioNombre: string | null
  nutriNombre: string
  nutriColor: string
  nutriMatricula: string
  noLeidos: number
  ultimoContenido: string | null
}

interface Mensaje {
  id: string
  conversacionId: string
  contenido: string
  autorId: string
  esNutricionista: boolean
  leido: boolean
  createdAt: string
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  const hoy = new Date()
  if (d.toDateString() === hoy.toDateString()) return formatHora(iso)
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
}

function NutriAvatar({ nombre, color, size = "md" }: { nombre: string; color: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`} style={{ backgroundColor: color }}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

function UserAvatar({ nombre }: { nombre: string | null }) {
  return (
    <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
      {(nombre ?? "U").charAt(0).toUpperCase()}
    </div>
  )
}

function ChatAdminPanel({
  conv,
  onBack,
  onMensajeEnviado,
}: {
  conv: Conversacion
  onBack: () => void
  onMensajeEnviado: (convId: string) => void
}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const scrollBottom = useCallback((force = false) => {
    if (force || atBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/mensajes/${conv.id}`)
      .then((r) => r.json())
      .then((d) => setMensajes(d.mensajes ?? []))
      .finally(() => {
        setLoading(false)
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50)
      })
  }, [conv.id])

  useEffect(() => {
    const channel = getPusherClient().subscribe(`private-privado-${conv.id}`)
    channel.bind("nuevo-mensaje", (data: Mensaje) => {
      setMensajes((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev
        return [...prev, { ...data, createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date(data.createdAt).toISOString() }]
      })
      setTimeout(() => scrollBottom(), 50)
    })
    return () => { channel.unbind_all(); getPusherClient().unsubscribe(`private-privado-${conv.id}`) }
  }, [conv.id, scrollBottom])

  async function enviar() {
    const contenido = texto.trim()
    if (!contenido || enviando || contenido.length > 500) return
    setTexto("")
    setEnviando(true)
    try {
      await fetch(`/api/admin/mensajes/${conv.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      })
      onMensajeEnviado(conv.id)
    } catch {
      setTexto(contenido)
    } finally {
      setEnviando(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const chars = texto.length

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="lg:hidden text-gray-400 hover:text-gray-600 mr-1">←</button>
        <UserAvatar nombre={conv.usuarioNombre} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{conv.usuarioNombre ?? "Usuario"}</p>
          <p className="text-xs text-gray-400">con {conv.nutriNombre} · Mat. {conv.nutriMatricula}</p>
        </div>
        <NutriAvatar nombre={conv.nutriNombre} color={conv.nutriColor} size="sm" />
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {loading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}
        {!loading && mensajes.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm"><div className="text-4xl mb-3">✉️</div><p>Sin mensajes.</p></div>
        )}
        {mensajes.map((m) => {
          const esNutri = m.esNutricionista
          return (
            <div key={m.id} className={`flex gap-2 items-end ${esNutri ? "flex-row-reverse" : "flex-row"}`}>
              {!esNutri && <UserAvatar nombre={conv.usuarioNombre} />}
              <div className={`max-w-[75%] flex flex-col ${esNutri ? "items-end" : "items-start"}`}>
                {!esNutri && <span className="text-xs text-gray-400 mb-0.5">{conv.usuarioNombre ?? "Paciente"}</span>}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  esNutri ? "bg-emerald-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                }`}>
                  {m.contenido}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5">{formatHora(m.createdAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
        <p className="text-xs text-gray-400 mb-2">Respondiendo como {conv.nutriNombre}</p>
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Escribí la respuesta del nutricionista..."
              className="w-full resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-16 max-h-32 overflow-y-auto"
            />
            <span className={`absolute right-3 bottom-2.5 text-[10px] font-medium ${chars > 500 ? "text-red-500" : chars > 400 ? "text-amber-500" : "text-gray-300"}`}>
              {chars}/500
            </span>
          </div>
          <button
            onClick={enviar}
            disabled={!texto.trim() || enviando || chars > 500}
            className="shrink-0 w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
          >
            {enviando ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function MensajesAdminTab({
  role = "ADMIN",
  nutricionistaId,
}: {
  role?: string
  nutricionistaId?: string
}) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [activa, setActiva] = useState<Conversacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroNutri, setFiltroNutri] = useState("")
  const [showPanel, setShowPanel] = useState(false)

  const fetchConversaciones = useCallback(() => {
    fetch("/api/admin/mensajes")
      .then((r) => r.json())
      .then((d) => {
        let convs: Conversacion[] = d.conversaciones ?? []
        // NUTRICIONISTA only sees their own conversations
        if (role === "NUTRICIONISTA" && nutricionistaId) {
          convs = convs.filter((c) => c.nutricionistaId === nutricionistaId)
        }
        setConversaciones(convs)
      })
      .finally(() => setLoading(false))
  }, [role, nutricionistaId])

  useEffect(() => { fetchConversaciones() }, [fetchConversaciones])

  const isAdmin = role === "ADMIN"
  const nutrisDisponibles = Array.from(new Set(conversaciones.map((c) => c.nutriNombre))).sort()
  const filtradas = filtroNutri
    ? conversaciones.filter((c) => c.nutriNombre === filtroNutri)
    : conversaciones

  function handleSelect(conv: Conversacion) {
    setActiva(conv)
    setShowPanel(true)
    setConversaciones((prev) => prev.map((c) => c.id === conv.id ? { ...c, noLeidos: 0 } : c))
  }

  function handleMensajeEnviado(convId: string) {
    setConversaciones((prev) =>
      prev.map((c) => c.id === convId ? { ...c, ultimoMensaje: new Date().toISOString() } : c)
        .sort((a, b) => new Date(b.ultimoMensaje).getTime() - new Date(a.ultimoMensaje).getTime())
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Left panel */}
      <div className={`${showPanel ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 border-r border-gray-200 shrink-0`}>
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 mb-2">Conversaciones ✉️</h2>
          {isAdmin && (
            <select
              value={filtroNutri}
              onChange={(e) => setFiltroNutri(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los nutricionistas</option>
              {nutrisDisponibles.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loading && <div className="p-6 text-center text-sm text-gray-400">Cargando...</div>}
          {!loading && filtradas.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Sin conversaciones.</div>
          )}
          {filtradas.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activa?.id === c.id ? "bg-emerald-50" : "hover:bg-gray-50"}`}
            >
              <UserAvatar nombre={c.usuarioNombre} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 truncate">{c.usuarioNombre ?? "Usuario"}</span>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatFecha(c.ultimoMensaje)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-400 truncate">
                    <span style={{ color: c.nutriColor }}>●</span> {c.nutriNombre} · {c.ultimoContenido ?? "Sin mensajes"}
                  </span>
                  {c.noLeidos > 0 && (
                    <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {c.noLeidos > 9 ? "9+" : c.noLeidos}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className={`${showPanel ? "flex" : "hidden lg:flex"} flex-col flex-1 min-w-0`}>
        {activa ? (
          <ChatAdminPanel conv={activa} onBack={() => setShowPanel(false)} onMensajeEnviado={handleMensajeEnviado} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="text-5xl">✉️</div>
            <p className="text-sm">Seleccioná una conversación</p>
          </div>
        )}
      </div>
    </div>
  )
}
