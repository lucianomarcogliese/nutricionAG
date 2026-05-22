'use client'

import { useState } from 'react'
import { GOAL_LABELS, ACTIVITY_LABELS, SEX_LABELS } from '@/lib/admin-translations'
import type { AdminUser } from './types'

interface Props {
  user: AdminUser
  onRoleChanged: (newRole: string) => void
  onOpenApptModal: () => void
}

export function UserProfileTab({ user, onRoleChanged, onOpenApptModal }: Props) {
  const [changingRole, setChangingRole] = useState(false)
  const [roleMsg, setRoleMsg] = useState<string | null>(null)

  async function handleRoleChange(newRole: string) {
    if (newRole === user.role || changingRole) return
    setChangingRole(true)
    setRoleMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        onRoleChanged(newRole)
        setRoleMsg('Role actualizado. El usuario verá los cambios en su próxima sesión o en hasta 5 minutos.')
      } else {
        setRoleMsg('Error al cambiar el role.')
      }
    } finally {
      setChangingRole(false)
    }
  }

  return (
    <div className="px-5 py-5 space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 shrink-0">Rol:</span>
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={changingRole}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          <option value="USER">USER</option>
          <option value="NUTRICIONISTA">NUTRICIONISTA</option>
          <option value="RECEPCIONISTA">RECEPCIONISTA</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        {changingRole && <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
      </div>
      {roleMsg && (
        <p className={`text-xs rounded-lg px-3 py-2 ${roleMsg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {roleMsg}
        </p>
      )}

      {user.profile?.onboardingCompleted ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Edad', value: user.profile.age ? `${user.profile.age} años` : '—' },
              { label: 'Peso', value: user.profile.weightKg ? `${user.profile.weightKg} kg` : '—' },
              { label: 'Altura', value: user.profile.heightCm ? `${user.profile.heightCm} cm` : '—' },
              { label: 'Sexo', value: user.profile.sex ? (SEX_LABELS[user.profile.sex] ?? user.profile.sex) : '—' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Objetivo</span>
              <span className="text-sm font-medium text-gray-900">
                {user.profile.goal ? (GOAL_LABELS[user.profile.goal] ?? user.profile.goal) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Actividad</span>
              <span className="text-sm font-medium text-gray-900">
                {user.profile.activityLevel ? (ACTIVITY_LABELS[user.profile.activityLevel] ?? user.profile.activityLevel) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Turnos</span>
              <span className="text-sm font-medium text-gray-900">{user._count.appointments}</span>
            </div>
          </div>

          {user.profile.dietaryRestrictions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Restricciones alimentarias</p>
              <div className="flex flex-wrap gap-2">
                {user.profile.dietaryRestrictions.map((r, i) => (
                  <span key={i} className="bg-amber-50 text-amber-700 text-xs rounded-full px-2.5 py-1 font-medium">{r}</span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Este usuario no completó el onboarding</p>
        </div>
      )}

      <button
        onClick={onOpenApptModal}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
      >
        Agendar turno
      </button>
    </div>
  )
}
