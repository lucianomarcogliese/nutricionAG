"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { ChatView } from "@/components/chat/ChatView"

interface Mensaje {
  id: string
  contenido: string
  profileId: string
  createdAt: string
  fullName: string | null
}

export function ChatAdminTab() {
  const { data: session } = useSession()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/chat/mensajes")
      .then((r) => r.json())
      .then((d) => {
        setMensajes(d.mensajes ?? [])
        setHasMore(d.hasMore ?? false)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Cargando chat...
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <ChatView
      mensajesIniciales={mensajes}
      hasMoreIniciales={hasMore}
      userId={session.user.id}
      profileId={(session.user as { profileId?: string }).profileId ?? ""}
      isAdmin
    />
  )
}
