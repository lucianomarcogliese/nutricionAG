import { LogoutButton } from '@/components/dashboard/LogoutButton'
import { SidebarNavLinks, BottomNav } from '@/components/dashboard/SidebarNav'

const NAV_ITEMS = [
  { href: '/dashboard',                label: 'Dashboard',       labelShort: 'Inicio',    icon: '🏠' },
  { href: '/dashboard/perfil',         label: 'Mi perfil',       labelShort: 'Perfil',    icon: '👤' },
  { href: '/dashboard/nutricion',      label: 'Nutrición',       labelShort: 'Nutrición', icon: '🥗' },
  { href: '/dashboard/entrenamientos', label: 'Entrenamientos',  labelShort: 'Entreno',   icon: '🏋️' },
  { href: '/dashboard/turnos',         label: 'Mis turnos',      labelShort: 'Turnos',    icon: '📅' },
  { href: '/dashboard/antropometria',  label: 'Antropometría',   labelShort: 'Mediciones',icon: '📏' },
  { href: '/dashboard/peso',           label: 'Seguimiento',     labelShort: 'Peso',      icon: '⚖️' },
  { href: '/dashboard/recetas',        label: 'Recetas',         labelShort: 'Recetas',   icon: '🍳' },
  { href: '/dashboard/descuentos',     label: 'Descuentos',      labelShort: 'Descuentos',icon: '🏷️' },
  { href: '/dashboard/chat',           label: 'Chat',            labelShort: 'Chat',      icon: '💬' },
  { href: '/dashboard/mensajes',       label: 'Mensajes',        labelShort: 'Mensajes',  icon: '✉️' },
  { href: '/planes',                   label: 'Planes',          labelShort: 'Planes',    icon: '💎' },
  { href: '/dashboard/configuracion',  label: 'Configuración',   labelShort: 'Config',    icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-gray-200 p-4 shrink-0">
        <span className="text-emerald-600 font-bold text-lg">Nutrición AG</span>

        <SidebarNavLinks items={NAV_ITEMS} />

        <div className="absolute bottom-6 left-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        {children}
      </main>

      {/* Mobile bottom navbar */}
      <BottomNav items={NAV_ITEMS} />
    </div>
  )
}
