"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { CheckCircle2, XCircle, X } from "lucide-react"

type ToastType = "success" | "error"

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (opts: { message: string; type?: ToastType }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ message, type = "success" }: { message: string; type?: ToastType }) => {
      const id = ++counter.current
      setToasts((prev) => [...prev, { id, message, type }])
      const delay = type === "error" ? 5000 : 3000
      setTimeout(() => dismiss(id), delay)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-xs animate-in slide-in-from-bottom-2 fade-in duration-200 ${
              t.type === "success"
                ? "bg-white border-emerald-200 text-gray-800"
                : "bg-white border-red-200 text-gray-800"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
