'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { StatsTab } from './tabs/StatsTab'
import { UsersTab } from './tabs/UsersTab'
import { CalendarTab } from './tabs/CalendarTab'
import { LandingTab } from './tabs/LandingTab'
import { TestimoniosTab } from './tabs/TestimoniosTab'
import { RecetasTab } from './tabs/RecetasTab'
import { DescuentosTab } from './tabs/DescuentosTab'
import { PlanesAdminTab } from './tabs/PlanesAdminTab'
import { MensajesAdminTab } from './tabs/MensajesAdminTab'
import { NutricionistasTab } from './tabs/NutricionistasTab'
import { AntropometriaTab } from './tabs/AntropometriaTab'

type Tab = 'stats' | 'users' | 'calendar' | 'testimonios' | 'recetas' | 'descuentos' | 'planes' | 'mensajes' | 'nutricionistas' | 'antropometria' | 'landing'

const ALL_NAV: { key: Tab; icon: string; label: string; roles: string[] }[] = [
  { key: 'stats',           icon: '📊', label: 'Estadísticas',   roles: ['ADMIN'] },
  { key: 'users',           icon: '👥', label: 'Usuarios',       roles: ['ADMIN'] },
  { key: 'calendar',        icon: '📅', label: 'Calendario',     roles: ['ADMIN', 'NUTRICIONISTA', 'RECEPCIONISTA'] },
  { key: 'mensajes',        icon: '✉️', label: 'Mensajes',       roles: ['ADMIN', 'NUTRICIONISTA'] },
  { key: 'testimonios',     icon: '📸', label: 'Testimonios',    roles: ['ADMIN'] },
  { key: 'recetas',         icon: '🍳', label: 'Recetas',        roles: ['ADMIN'] },
  { key: 'descuentos',      icon: '🏷️', label: 'Descuentos',    roles: ['ADMIN'] },
  { key: 'nutricionistas',  icon: '👨‍⚕️', label: 'Nutricionistas', roles: ['ADMIN'] },
  { key: 'antropometria',   icon: '📏', label: 'Antropometría',  roles: ['ADMIN', 'NUTRICIONISTA'] },
  { key: 'planes',          icon: '⚙️', label: 'Planes',         roles: ['ADMIN'] },
  { key: 'landing',         icon: '🌐', label: 'Landing',        roles: ['ADMIN'] },
]

export function AdminDashboard({
  role,
  nutricionistaId,
}: {
  role: string
  nutricionistaId?: string
}) {
  const nav = ALL_NAV.filter((item) => item.roles.includes(role))
  const defaultTab = role === 'NUTRICIONISTA' ? 'mensajes' : role === 'RECEPCIONISTA' ? 'calendar' : 'stats'
  const [active, setActive] = useState<Tab>(defaultTab as Tab)

  const roleBadge = role === 'NUTRICIONISTA' ? 'Nutricionista' : role === 'RECEPCIONISTA' ? 'Recepcionista' : 'Admin'
  const roleBadgeColor = role === 'NUTRICIONISTA' ? 'bg-blue-100 text-blue-700' : role === 'RECEPCIONISTA' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 font-bold text-lg">Nutrición AG</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadgeColor}`}>{roleBadge}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Ir al dashboard →
          </a>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col w-52 bg-white border-r border-gray-200 py-4 px-3 shrink-0">
          <nav className="space-y-1">
            {nav.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  active === item.key
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex overflow-x-auto">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors min-w-[4rem] ${
                active === item.key ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {active === 'stats'          && <StatsTab />}
            {active === 'users'          && <UsersTab />}
            {active === 'calendar'       && <CalendarTab />}
            {active === 'testimonios'    && <TestimoniosTab />}
            {active === 'recetas'        && <RecetasTab />}
            {active === 'descuentos'     && <DescuentosTab />}
            {active === 'nutricionistas' && <NutricionistasTab />}
            {active === 'antropometria'  && <AntropometriaTab />}
            {active === 'planes'         && <PlanesAdminTab />}
            {active === 'mensajes'       && <MensajesAdminTab role={role} nutricionistaId={nutricionistaId} />}
            {active === 'landing'        && <LandingTab />}
          </div>
        </main>
      </div>
    </div>
  )
}
