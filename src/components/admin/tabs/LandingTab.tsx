'use client'

import { useState, useEffect } from 'react'
import { AdminPanel } from '@/components/admin/AdminPanel'
import type { LandingData } from '@/lib/landing-seed'

export function LandingTab() {
  const [data, setData] = useState<LandingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/landing')
      .then((r) => r.json())
      .then((d: LandingData) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 animate-pulse rounded-2xl h-12 w-48" />
        <div className="bg-gray-100 animate-pulse rounded-2xl h-64" />
      </div>
    )
  }

  if (error || !data) {
    return <p className="text-sm text-red-500">Error al cargar el contenido de la landing.</p>
  }

  return <AdminPanel initialData={data} />
}
