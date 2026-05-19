'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">No pudimos cargar esta sección</h2>
        <p className="text-sm text-gray-500 mb-6">
          Ocurrió un error al cargar el contenido. Podés intentar de nuevo o volver al inicio.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <pre className="text-xs text-left bg-red-50 border border-red-100 text-red-600 rounded-lg p-3 mb-6 overflow-auto max-h-32 whitespace-pre-wrap break-all">
            {error.message}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
