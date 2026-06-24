'use client'

import { useState } from 'react'
import { TIPO_LABELS } from '@/lib/admin-translations'
import type { AdminUser } from './types'
import { UserProfileTab } from './UserProfileTab'
import { UserEntrenamientoTab } from './UserEntrenamientoTab'
import { UserNutricionNuevoTab } from './UserNutricionNuevoTab'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  user: AdminUser
  onClose: () => void
  onRoleChanged: (newRole: string) => void
  onAppointmentCreated: () => void
}

const TIPOS = ['CONSULTA_NUTRICIONAL', 'SEGUIMIENTO', 'ANTROPOMETRIA', 'CONSULTA_DEPORTIVA'] as const
const DURACIONES = [30, 45, 60, 90]

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"

const tabBtnCls = (active: boolean) =>
  `flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${active ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`

type DrawerTab = 'perfil' | 'entrenamiento' | 'nutricion'

export function UserDetailModal({ user, onClose, onRoleChanged, onAppointmentCreated }: Props) {
  const { toast } = useToast()
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('perfil')
  const [showApptModal, setShowApptModal] = useState(false)
  const [apptForm, setApptForm] = useState({ fecha: '', tipo: 'CONSULTA_NUTRICIONAL', duracion: 60, notas: '' })
  const [saving, setSaving] = useState(false)

  async function handleSchedule() {
    if (!apptForm.fecha) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, fecha: apptForm.fecha, tipo: apptForm.tipo, duracion: apptForm.duracion, notas: apptForm.notas || undefined }),
      })
      if (res.ok) {
        toast({ message: 'Turno agendado correctamente', type: 'success' })
        onAppointmentCreated()
        setShowApptModal(false)
      } else {
        toast({ message: 'Error al agendar turno', type: 'error' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Detalle de usuario" className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-xl z-50 flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
              {(user.profile?.fullName ?? user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user.profile?.fullName ?? user.name ?? '—'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-2 shrink-0">×</button>
        </div>

        <div className="flex border-b border-gray-100 shrink-0">
          {(['perfil', 'entrenamiento', 'nutricion'] as const).map((t) => (
            <button key={t} onClick={() => setDrawerTab(t)} className={tabBtnCls(drawerTab === t)}>
              {t === 'perfil' ? 'Perfil' : t === 'entrenamiento' ? 'Entrenamiento' : 'Nutrición'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {drawerTab === 'perfil' && (
            <UserProfileTab
              user={user}
              onRoleChanged={onRoleChanged}
              onOpenApptModal={() => { setShowApptModal(true); setApptForm({ fecha: '', tipo: 'CONSULTA_NUTRICIONAL', duracion: 60, notas: '' }) }}
            />
          )}
          {drawerTab === 'entrenamiento' && <UserEntrenamientoTab userId={user.id} />}
          {drawerTab === 'nutricion' && <UserNutricionNuevoTab userId={user.id} />}
        </div>
      </aside>

      {showApptModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nuevo turno</h3>
              <button onClick={() => setShowApptModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-emerald-50 rounded-lg px-3 py-2 text-sm text-emerald-700 font-medium">
                {user.profile?.fullName ?? user.name ?? user.email}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha y hora</label>
                <input type="datetime-local" value={apptForm.fecha}
                  onChange={(e) => setApptForm({ ...apptForm, fecha: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de consulta</label>
                <select value={apptForm.tipo} onChange={(e) => setApptForm({ ...apptForm, tipo: e.target.value })} className={inputCls}>
                  {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Duración</label>
                <select value={apptForm.duracion} onChange={(e) => setApptForm({ ...apptForm, duracion: parseInt(e.target.value) })} className={inputCls}>
                  {DURACIONES.map((d) => <option key={d} value={d}>{d} minutos</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notas (opcional)</label>
                <textarea rows={2} value={apptForm.notas}
                  onChange={(e) => setApptForm({ ...apptForm, notas: e.target.value })}
                  placeholder="Observaciones..."
                  className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 justify-end">
              <button onClick={() => setShowApptModal(false)} className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium">Cancelar</button>
              <button
                onClick={handleSchedule}
                disabled={!apptForm.fecha || saving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
              >
                {saving ? 'Guardando...' : 'Confirmar turno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
