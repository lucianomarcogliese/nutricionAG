"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { getPusherClient } from "@/lib/pusher-client"

interface Mensaje {
  id: string
  contenido: string
  profileId: string
  createdAt: string
  fullName: string | null
  // from Pusher event
  autor?: { nombre: string; inicial: string }
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

function Avatar({ inicial, size = "md" }: { inicial: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"
  return (
    <div className={`${sz} rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0`}>
      {inicial}
    </div>
  )
}

export function ChatView({
  mensajesIniciales,
  hasMoreIniciales,
  userId,
  profileId,
  isAdmin,
}: {
  mensajesIniciales: Mensaje[]
  hasMoreIniciales: boolean
  userId: string
  profileId: string
  isAdmin: boolean
}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales)
  const [hasMore, setHasMore] = useState(hasMoreIniciales)
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false)
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)

  // Track if user is near bottom
  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  // Scroll to bottom
  const scrollBottom = useCallback((force = false) => {
    if (force || atBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  // Initial scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  // Pusher subscription
  useEffect(() => {
    const channel = getPusherClient().subscribe("chat-comunidad")
    channel.bind("nuevo-mensaje", (data: Mensaje) => {
      setMensajes((prev) => {
        // Avoid duplicates (our own optimistic message already added)
        if (prev.some((m) => m.id === data.id)) return prev
        return [...prev, data]
      })
      setTimeout(() => scrollBottom(), 50)
    })
    return () => {
      channel.unbind_all()
      getPusherClient().unsubscribe("chat-comunidad")
    }
  }, [scrollBottom])

  async function cargarAnteriores() {
    if (!hasMore || cargandoAnteriores || mensajes.length === 0) return
    setCargandoAnteriores(true)
    const oldest = mensajes[0].createdAt
    try {
      const res = await fetch(`/api/chat/mensajes?before=${encodeURIComponent(oldest)}`)
      if (!res.ok) return
      const data = await res.json() as { mensajes: Mensaje[]; hasMore: boolean }
      const scrollEl = scrollRef.current
      const prevScrollHeight = scrollEl?.scrollHeight ?? 0
      setMensajes((prev) => [...data.mensajes, ...prev])
      setHasMore(data.hasMore)
      requestAnimationFrame(() => {
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollHeight
        }
      })
    } catch {
      // silent
    } finally {
      setCargandoAnteriores(false)
    }
  }

  async function enviar() {
    const contenido = texto.trim()
    if (!contenido || enviando) return

    setTexto("")
    setEnviando(true)

    try {
      const res = await fetch("/api/chat/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      })
      if (!res.ok) {
        setTexto(contenido)
        return
      }
    } catch {
      setTexto(contenido)
    } finally {
      setEnviando(false)
    }
  }

  async function eliminar(id: string) {
    setMensajes((prev) => prev.filter((m) => m.id !== id))
    try {
      await fetch(`/api/chat/mensajes/${id}`, { method: "DELETE" })
    } catch {
      // silent — message already removed from UI
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const chars = texto.length
  const overLimit = chars > 500

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-3.5rem)] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-tight">Chat Comunitario 💬</h1>
          <p className="text-xs text-gray-400">Comunidad Nutrición AG</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
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

        {mensajes.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            <div className="text-4xl mb-3">💬</div>
            <p>Sé el primero en escribir en el chat.</p>
          </div>
        )}

        {mensajes.map((m) => {
          const esPropio = m.profileId === profileId
          const nombre = m.autor?.nombre ?? m.fullName ?? "Usuario"
          const inicial = (m.autor?.inicial ?? nombre.charAt(0)).toUpperCase()
          const canDelete = esPropio || isAdmin

          return (
            <div
              key={m.id}
              className={`flex gap-2 items-end ${esPropio ? "flex-row-reverse" : "flex-row"}`}
            >
              {!esPropio && <Avatar inicial={inicial} />}

              <div className={`max-w-[75%] group ${esPropio ? "items-end" : "items-start"} flex flex-col`}>
                {!esPropio && (
                  <span className="text-xs text-gray-400 ml-1 mb-0.5">{nombre}</span>
                )}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    esPropio
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {m.contenido}
                </div>
                <div className={`flex items-center gap-1.5 mt-0.5 ${esPropio ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="text-[10px] text-gray-400">{formatHora(m.createdAt)}</span>
                  {canDelete && (
                    <button
                      onClick={() => eliminar(m.id)}
                      className="text-[10px] text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {esPropio && <Avatar inicial={inicial} size="sm" />}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Escribí un mensaje... (Enter para enviar)"
              className="w-full resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-16 max-h-32 overflow-y-auto"
              style={{ lineHeight: "1.5" }}
            />
            <span
              className={`absolute right-3 bottom-2.5 text-[10px] font-medium ${
                overLimit ? "text-red-500" : chars > 400 ? "text-amber-500" : "text-gray-300"
              }`}
            >
              {chars}/500
            </span>
          </div>
          <button
            onClick={enviar}
            disabled={!texto.trim() || enviando || overLimit}
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
