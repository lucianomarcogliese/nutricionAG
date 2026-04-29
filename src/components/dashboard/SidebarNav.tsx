'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

type NavItem = {
  href: string
  label: string
  labelShort: string
  icon: string
}

type Props = {
  items: NavItem[]
}

function linkClass(isActive: boolean) {
  const base = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm'
  return isActive
    ? `${base} bg-emerald-50 text-emerald-700 font-medium`
    : `${base} text-gray-600 hover:bg-gray-50 hover:text-gray-900`
}

export function SidebarNavLinks({ items }: Props) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 mt-8">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={linkClass(pathname === item.href)}>
          <span className="text-lg leading-none">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export function BottomNav({ items }: Props) {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2">
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? 'flex flex-col items-center gap-0.5 px-3 py-2 text-emerald-700 font-medium rounded-lg'
                : 'flex flex-col items-center gap-0.5 px-3 py-2 text-gray-600 rounded-lg'
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px]">{item.labelShort}</span>
          </Link>
        )
      })}
      <button
        onClick={() => signOut({ callbackUrl: '/auth/login' })}
        className="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-500 hover:text-red-500 rounded-lg transition-colors"
      >
        <span className="text-xl leading-none">🚪</span>
        <span className="text-[10px]">Salir</span>
      </button>
    </nav>
  )
}
