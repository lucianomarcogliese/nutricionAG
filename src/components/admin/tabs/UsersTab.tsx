'use client'

import { useState, useEffect } from 'react'
import type { AdminUser } from '@/components/admin/users/types'
import { UsersTable } from '@/components/admin/users/UsersTable'
import { UserDetailModal } from '@/components/admin/users/UserDetailModal'

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AdminUser | null>(null)

  function fetchUsers() {
    setLoading(true)
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data: { users: AdminUser[] }) => setUsers(data.users ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  function handleRoleChanged(newRole: string) {
    if (!selected) return
    const updated = { ...selected, role: newRole }
    setSelected(updated)
    setUsers((prev) => prev.map((u) => u.id === selected.id ? { ...u, role: newRole } : u))
  }

  function handleAppointmentCreated() {
    if (!selected) return
    setUsers((prev) => prev.map((u) =>
      u.id === selected.id ? { ...u, _count: { appointments: u._count.appointments + 1 } } : u
    ))
  }

  return (
    <div>
      <UsersTable users={users} loading={loading} onSelect={setSelected} />
      {selected && (
        <UserDetailModal
          key={selected.id}
          user={selected}
          onClose={() => setSelected(null)}
          onRoleChanged={handleRoleChanged}
          onAppointmentCreated={handleAppointmentCreated}
        />
      )}
    </div>
  )
}
