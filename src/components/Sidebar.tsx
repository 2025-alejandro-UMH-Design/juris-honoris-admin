'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Scale,
  Users,
  BrainCircuit,
  Database,
  FileText,
  LogOut,
} from 'lucide-react'
import { clearToken } from '@/lib/api'

const nav = [
  { href: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/abogados',    icon: Scale,           label: 'Abogados' },
  { href: '/dashboard/usuarios',    icon: Users,           label: 'Usuarios' },
  { href: '/dashboard/solicitudes', icon: FileText,        label: 'Solicitudes' },
  { href: '/dashboard/ia-config',   icon: BrainCircuit,    label: 'Config IA' },
  { href: '/dashboard/base-datos',  icon: Database,        label: 'Base de Datos' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  function logout() {
    clearToken()
    router.push('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-brand-dark flex flex-col select-none">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Scale size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Juris Honoris</p>
            <p className="text-white/40 text-xs">Administración</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 pt-3 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/70 transition-all"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
