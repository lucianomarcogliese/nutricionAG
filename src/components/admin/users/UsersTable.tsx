'use client'

import { useState } from 'react'
import { GOAL_LABELS } from '@/lib/admin-translations'
import type { AdminUser } from './types'

interface Props {
  users: AdminUser[]
  loading: boolean
  onSelect: (user: AdminUser) => void
}

export function UsersTable({ users, loading, onSelect }: Props) {
  const [search, setSearch] = useState('')

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (u.name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.profile?.fullName ?? '').toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="bg-gray-100 animate-pulse rounded-xl h-10 w-64" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-14" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} registrados</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-60 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Objetivo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Registro</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Turnos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                onClick={() => onSelect(u)}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                      {(u.profile?.fullName ?? u.name ?? u.email ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.profile?.fullName ?? u.name ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {u.profile?.onboardingCompleted
                    ? <span className="bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full px-2.5 py-0.5">Perfil completo</span>
                    : <span className="bg-gray-100 text-gray-500 text-xs font-medium rounded-full px-2.5 py-0.5">Sin perfil</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                  {u.profile?.goal ? (GOAL_LABELS[u.profile.goal] ?? u.profile.goal) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">
                  {new Date(u.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-gray-700 font-medium">{u._count.appointments}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
