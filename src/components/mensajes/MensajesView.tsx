"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { getPusherClient } from "@/lib/pusher-client"
import { useToast } from "@/components/ui/ToastProvider"

interface Nutricionista {
  id: string
  nombre: string
  matricula: string
  color: string
}

interface Conversacion {
  id: string
  profileId: string
  nutricionistaId: string
  ultimoMensaje: string
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

function NutriAvatar({ nombre, color, size = "md" }: { nombre: string; color: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "w-10 h-10 text-base" : size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: color }}
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

function ConvItem({
  conv,
  active,
  onClick,
}: {
  conv: Conversacion
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        active ? "bg-emerald-50" : "hover:bg-gray-50"
      }`}
    >
      <NutriAvatar nombre={conv.nutriNombre} color={conv.nutriColor} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 truncate">{conv.nutriNombre}</span>
          <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatFecha(conv.ultimoMensaje)}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-gray-500 truncate">
            {conv.ultimoContenido ?? "Sin mensajes aún"}
          </span>
          {conv.noLeidos > 0 && (
            <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
              {conv.noLeidos > 9 ? "9+" : conv.noLeidos}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ChatPanel({
  conv,
  profileId,
  userId,
  onBack,
  onMensajeEnviado,
}: {
  conv: Conversacion
  profileId: string
  userId: string
  onBack: () => void
  onMensajeEnviado: (convId: string) => void
}) {
  const { toast } = useToast()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false)
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const scrollBottom = useCallback((force = false) => {
    if (force || atBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    setErrorCarga(false)
    fetch(`/api/mensajes/${conv.id}`)
      .then((r) => r.json())
      .then((d) => {
        setMensajes(d.mensajes ?? [])
        setHasMore(d.hasMore ?? false)
      })
      .catch(() => setErrorCarga(true))
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
    return () => {
      channel.unbind_all()
      getPusherClient().unsubscribe(`private-privado-${conv.id}`)
    }
  }, [conv.id, scrollBottom])

  async function cargarAnteriores() {
    if (!hasMore || cargandoAnteriores || mensajes.length === 0) return
    setCargandoAnteriores(true)
    const oldest = mensajes[0].createdAt
    try {
      const res = await fetch(`/api/mensajes/${conv.id}?before=${encodeURIComponent(oldest)}`)
      if (!res.ok) return
      const data = await res.json() as { mensajes: Mensaje[]; hasMore: boolean }
      const scrollEl = scrollRef.current
      const prevScrollHeight = scrollEl?.scrollHeight ?? 0
      setMensajes((prev) => [...data.mensajes, ...prev])
      setHasMore(data.hasMore)
      requestAnimationFrame(() => {
        if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollHeight
      })
    } catch {
      // silent
    } finally {
      setCargandoAnteriores(false)
    }
  }

  async function enviar() {
    const contenido = texto.trim()
    if (!contenido || enviando || contenido.length > 500) return
    setTexto("")
    setEnviando(true)
    try {
      const res = await fetch(`/api/mensajes/${conv.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      })
      if (!res.ok) {
        setTexto(contenido)
        toast({ message: "No se pudo enviar el mensaje. Intentá de nuevo.", type: "error" })
        return
      }
      onMensajeEnviado(conv.id)
    } catch {
      setTexto(contenido)
      toast({ message: "No se pudo enviar el mensaje. Intentá de nuevo.", type: "error" })
    } finally {
      setEnviando(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const chars = texto.length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="lg:hidden text-gray-400 hover:text-gray-600 mr-1">
          ←
        </button>
        <NutriAvatar nombre={conv.nutriNombre} color={conv.nutriColor} size="md" />
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">{conv.nutriNombre}</p>
          <p className="text-xs text-gray-400">Mat. {conv.nutriMatricula}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={cargarAnteriores}
              disabled={cargandoAnteriores}
              className="text-xs text-emerald-600 hover:underline disabled:opacity-50"
            >
              {cargandoAnteriores ? "Cargando..." : "Cargar mensajes anteriores"}
            </button>
          </div>
        )}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && errorCarga && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>No se pudieron cargar los mensajes.</p>
            <button onClick={() => { setErrorCarga(false); setLoading(true); fetch(`/api/mensajes/${conv.id}`).then(r => r.json()).then(d => { setMensajes(d.mensajes ?? []); setHasMore(d.hasMore ?? false) }).catch(() => setErrorCarga(true)).finally(() => setLoading(false)) }} className="mt-2 text-emerald-600 text-xs hover:underline">
              Reintentar
            </button>
          </div>
        )}
        {!loading && !errorCarga && mensajes.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <div className="text-4xl mb-3">✉️</div>
            <p>Escribí tu primer mensaje.</p>
          </div>
        )}
        {mensajes.map((m) => {
          const esPropio = m.autorId === userId
          return (
            <div key={m.id} className={`flex gap-2 items-end ${esPropio ? "flex-row-reverse" : "flex-row"}`}>
              {!esPropio && <NutriAvatar nombre={conv.nutriNombre} color={conv.nutriColor} size="sm" />}
              <div className={`max-w-[75%] flex flex-col ${esPropio ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    esPropio
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {m.contenido}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5">{formatHora(m.createdAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Escribí un mensaje..."
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
            {enviando ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
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

export function MensajesView({ profileId, userId }: { profileId: string; userId: string }) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [activa, setActiva] = useState<Conversacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNutris, setShowNutris] = useState(false)
  const [nutris, setNutris] = useState<Nutricionista[]>([])
  const [creando, setCreando] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  const fetchConversaciones = useCallback(async (): Promise<Conversacion[]> => {
    const r = await fetch("/api/mensajes")
    const d = await r.json()
    const lista: Conversacion[] = d.conversaciones ?? []
    setConversaciones(lista)
    setLoading(false)
    return lista
  }, [])

  useEffect(() => { fetchConversaciones() }, [fetchConversaciones])

  async function abrirNueva() {
    setShowNutris(true)
    if (nutris.length === 0) {
      const r = await fetch("/api/nutricionistas")
      if (r.ok) {
        const d = await r.json()
        setNutris(d.nutricionistas ?? [])
      }
    }
  }

  async function iniciarConversacion(nutricionistaId: string) {
    setCreando(true)
    try {
      const res = await fetch("/api/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nutricionistaId }),
      })
      const data = await res.json()
      const convId = data.conversacion?.id
      const lista = await fetchConversaciones()
      setShowNutris(false)
      if (convId) {
        const found = lista.find((c) => c.id === convId)
        if (found) { setActiva(found); setShowPanel(true) }
      }
    } finally {
      setCreando(false)
    }
  }

  function handleSelectConv(conv: Conversacion) {
    setActiva(conv)
    setShowPanel(true)
    setShowNutris(false)
    // Clear unread count
    setConversaciones((prev) => prev.map((c) => c.id === conv.id ? { ...c, noLeidos: 0 } : c))
  }

  function handleMensajeEnviado(convId: string) {
    setConversaciones((prev) =>
      prev.map((c) => c.id === convId ? { ...c, ultimoMensaje: new Date().toISOString() } : c)
        .sort((a, b) => new Date(b.ultimoMensaje).getTime() - new Date(a.ultimoMensaje).getTime())
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-3.5rem)] bg-white">
      {/* Left panel — conversation list */}
      <div className={`${showPanel ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 border-r border-gray-200 shrink-0`}>
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h1 className="font-bold text-gray-900">Mensajes ✉️</h1>
          <button
            onClick={abrirNueva}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            + Nueva
          </button>
        </div>

        {/* Nueva conversación — pick nutricionista */}
        {showNutris && (
          <div className="border-b border-gray-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-700 mb-2">Elegí un nutricionista:</p>
            {nutris.length === 0 ? (
              <p className="text-xs text-gray-400">Cargando...</p>
            ) : (
              <div className="space-y-1">
                {nutris.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => iniciarConversacion(n.id)}
                    disabled={creando}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white text-left transition-colors disabled:opacity-50"
                  >
                    <NutriAvatar nombre={n.nombre} color={n.color} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{n.nombre}</p>
                      <p className="text-xs text-gray-400">Mat. {n.matricula}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowNutris(false)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loading && (
            <div className="p-6 text-center text-sm text-gray-400">Cargando...</div>
          )}
          {!loading && conversaciones.length === 0 && !showNutris && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">✉️</div>
              <p className="text-sm text-gray-500 mb-3">No tenés conversaciones aún.</p>
              <button onClick={abrirNueva} className="text-sm text-emerald-600 font-medium">
                Iniciar una conversación
              </button>
            </div>
          )}
          {conversaciones.map((c) => (
            <ConvItem
              key={c.id}
              conv={c}
              active={activa?.id === c.id}
              onClick={() => handleSelectConv(c)}
            />
          ))}
        </div>
      </div>

      {/* Right panel — chat */}
      <div className={`${showPanel ? "flex" : "hidden lg:flex"} flex-col flex-1 min-w-0`}>
        {activa ? (
          <ChatPanel
            conv={activa}
            profileId={profileId}
            userId={userId}
            onBack={() => setShowPanel(false)}
            onMensajeEnviado={handleMensajeEnviado}
          />
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
