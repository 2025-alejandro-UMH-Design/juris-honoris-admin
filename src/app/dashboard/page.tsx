'use client'
import { useEffect, useState } from 'react'
import { Users, Briefcase, FolderOpen, Clock, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface Stats {
  total_clients: number
  total_lawyers_approved: number
  total_cases: number
  pending_requests: number
  pending_verifications: number
}

const cards = [
  {
    key: 'total_clients',
    label: 'Clientes registrados',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    href: '/dashboard/usuarios',
  },
  {
    key: 'total_lawyers_approved',
    label: 'Abogados activos',
    icon: Briefcase,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    href: '/dashboard/abogados',
  },
  {
    key: 'total_cases',
    label: 'Casos totales',
    icon: FolderOpen,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    href: null,
  },
  {
    key: 'pending_requests',
    label: 'Solicitudes pendientes',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    href: '/dashboard/solicitudes',
  },
  {
    key: 'pending_verifications',
    label: 'Verificaciones pendientes',
    icon: ShieldCheck,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    href: '/dashboard/abogados',
  },
]

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get<Stats>('/admin/stats')
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Resumen general de la plataforma</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(({ key, label, icon: Icon, color, bg, href }) => {
          const content = (
            <div className={`bg-white rounded-xl p-5 border border-slate-100 shadow-sm transition-all ${href ? 'hover:border-slate-200 hover:shadow-md cursor-pointer' : ''}`}>
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg} mb-4`}>
                <Icon size={17} className={color} strokeWidth={1.75} />
              </div>
              <p className="text-2xl font-bold text-slate-800 leading-none">
                {loading ? <span className="text-slate-200 animate-pulse">—</span> : (stats?.[key as keyof Stats] ?? 0)}
              </p>
              <p className="text-slate-400 text-xs mt-1.5 leading-tight">{label}</p>
            </div>
          )
          return href
            ? <Link key={key} href={href}>{content}</Link>
            : <div key={key}>{content}</div>
        })}
      </div>

      {/* Alerts */}
      <div className="mt-5 space-y-2">
        {(stats?.pending_requests ?? 0) > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-blue-500" strokeWidth={2} />
              <p className="text-blue-800 text-sm">
                <span className="font-semibold">{stats?.pending_requests}</span> solicitud(es) de asesoría pendientes
              </p>
            </div>
            <Link
              href="/dashboard/solicitudes"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              Ver <ArrowRight size={13} />
            </Link>
          </div>
        )}
        {(stats?.pending_verifications ?? 0) > 0 && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-amber-500" strokeWidth={2} />
              <p className="text-amber-800 text-sm">
                <span className="font-semibold">{stats?.pending_verifications}</span> abogado(s) esperando verificación
              </p>
            </div>
            <Link
              href="/dashboard/abogados"
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
            >
              Revisar <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
