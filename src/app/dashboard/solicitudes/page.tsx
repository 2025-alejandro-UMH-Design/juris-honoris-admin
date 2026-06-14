'use client'
import { useEffect, useState } from 'react'
import { RefreshCw, Clock, CheckCircle, XCircle, Ban, X } from 'lucide-react'
import { api } from '@/lib/api'

interface Request {
  id: string
  case_type: string
  urgency: string
  description: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
  responded_at: string | null
  rejection_reason: string | null
  client_name: string
  client_email: string
  lawyer_name: string
  lawyer_email: string
  case_title: string | null
}

type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'

const STATUS_TABS: { key: FilterStatus; label: string }[] = [
  { key: 'all',       label: 'Todas' },
  { key: 'pending',   label: 'Pendientes' },
  { key: 'accepted',  label: 'Aceptadas' },
  { key: 'rejected',  label: 'Rechazadas' },
  { key: 'cancelled', label: 'Canceladas' },
]

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Pendiente',  icon: Clock },
  accepted:  { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Aceptada',  icon: CheckCircle },
  rejected:  { bg: 'bg-red-50',    text: 'text-red-600',    label: 'Rechazada',  icon: XCircle },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500',  label: 'Cancelada',  icon: Ban },
}

const URGENCY_STYLE: Record<string, string> = {
  high:   'bg-red-50 text-red-600',
  normal: 'bg-slate-100 text-slate-600',
  low:    'bg-blue-50 text-blue-600',
}
const URGENCY_LABEL: Record<string, string> = { high: 'Alta', normal: 'Normal', low: 'Baja' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SolicitudesPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<FilterStatus>('all')
  const [selected, setSelected] = useState<Request | null>(null)

  async function load(status: FilterStatus = tab) {
    setLoading(true)
    try {
      const qs = status !== 'all' ? `?status=${status}` : ''
      setRequests(await api.get<Request[]>(`/admin/requests${qs}`))
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(tab) }, [tab])

  const counts = {
    pending:   requests.filter(r => r.status === 'pending').length,
    accepted:  requests.filter(r => r.status === 'accepted').length,
    rejected:  requests.filter(r => r.status === 'rejected').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  }

  function tabLabel(key: FilterStatus) {
    if (key === 'all') return `Todas · ${requests.length}`
    const n = counts[key as keyof typeof counts]
    return `${STATUS_TABS.find(t => t.key === key)?.label} · ${n}`
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Solicitudes</h1>
          <p className="text-slate-400 text-sm mt-0.5">Solicitudes de asesoría entre clientes y abogados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5 flex-wrap gap-0.5">
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {loading && tab === t.key ? t.label : tabLabel(t.key)}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(tab)}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center text-slate-300 py-16 text-sm">Cargando...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-slate-400 py-16 text-sm">Sin solicitudes</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Cliente', 'Abogado', 'Tipo de caso', 'Urgencia', 'Estado', 'Fecha', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.map(r => {
                const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending
                const StatusIcon = s.icon
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{r.client_name}</p>
                      <p className="text-slate-400 text-xs">{r.client_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{r.lawyer_name}</p>
                      <p className="text-slate-400 text-xs">{r.lawyer_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 text-xs font-medium">{r.case_type}</p>
                      {r.case_title && (
                        <p className="text-slate-400 text-xs truncate max-w-[120px]">{r.case_title}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${URGENCY_STYLE[r.urgency] ?? URGENCY_STYLE.normal}`}>
                        {URGENCY_LABEL[r.urgency] ?? r.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${s.bg} ${s.text}`}>
                        <StatusIcon size={11} strokeWidth={2} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(r)}
                        className="text-xs text-brand hover:underline font-medium"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Detalle de solicitud</h2>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {(() => {
                const s = STATUS_STYLE[selected.status] ?? STATUS_STYLE.pending
                const StatusIcon = s.icon
                return (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${s.bg} ${s.text}`}>
                      <StatusIcon size={12} strokeWidth={2} />
                      {s.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${URGENCY_STYLE[selected.urgency] ?? URGENCY_STYLE.normal}`}>
                      Urgencia: {URGENCY_LABEL[selected.urgency] ?? selected.urgency}
                    </span>
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Cliente',    selected.client_name],
                  ['Abogado',    selected.lawyer_name],
                  ['Email cliente',  selected.client_email],
                  ['Email abogado',  selected.lawyer_email],
                  ['Tipo de caso',   selected.case_type],
                  ['Caso vinculado', selected.case_title ?? '—'],
                  ['Creado',         formatDate(selected.created_at)],
                  ['Respondido',     selected.responded_at ? formatDate(selected.responded_at) : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-slate-800 break-all">{val}</p>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Descripción</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {selected.rejection_reason && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs text-red-400 mb-1 font-semibold">Motivo de rechazo</p>
                  <p className="text-sm text-red-700">{selected.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
