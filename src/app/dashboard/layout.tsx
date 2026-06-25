import { LogoutButton } from '@/components/dashboard/LogoutButton'
import { SidebarNavLinks, BottomNav } from '@/components/dashboard/SidebarNav'

const NAV_ITEMS = [
  { href: '/dashboard',                label: 'Dashboard',       labelShort: 'Inicio',    icon: 'Home' },
  { href: '/dashboard/perfil',         label: 'Mi perfil',       labelShort: 'Perfil',    icon: 'User' },
  { href: '/dashboard/nutricion',      label: 'Nutrición',       labelShort: 'Nutrición', icon: 'Salad' },
  { href: '/dashboard/entrenamientos', label: 'Entrenamientos',  labelShort: 'Entreno',   icon: 'Dumbbell' },
  { href: '/dashboard/turnos',         label: 'Mis turnos',      labelShort: 'Turnos',    icon: 'Calendar' },
  { href: '/dashboard/antropometria',  label: 'Antropometría',   labelShort: 'Mediciones',icon: 'Ruler' },
  { href: '/dashboard/peso',           label: 'Seguimiento',     labelShort: 'Peso',      icon: 'Scale' },
  { href: '/dashboard/recetas',        label: 'Recetas',         labelShort: 'Recetas',   icon: 'ChefHat' },
  { href: '/dashboard/descuentos',     label: 'Descuentos',      labelShort: 'Descuentos',icon: 'Tag' },
  { href: '/dashboard/chat',           label: 'Chat',            labelShort: 'Chat',      icon: 'MessageCircle' },
  { href: '/dashboard/mensajes',       label: 'Mensajes',        labelShort: 'Mensajes',  icon: 'Mail' },
  { href: '/planes',                   label: 'Planes',          labelShort: 'Planes',    icon: 'Gem' },
  { href: '/dashboard/configuracion',  label: 'Configuración',   labelShort: 'Config',    icon: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-gray-200 p-4 shrink-0">
        <span className="text-emerald-600 font-bold text-lg">Nutrición AG</span>

        <div className="flex-1 overflow-y-auto min-h-0">
          <SidebarNavLinks items={NAV_ITEMS} />
        </div>

        <div className="pt-2 mt-2 border-t border-gray-100 shrink-0">
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
