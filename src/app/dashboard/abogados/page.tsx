'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, MapPin, GraduationCap, Hash, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

interface Lawyer {
  id: string
  full_name: string
  email: string
  phone: string
  colegiacion_number: string
  experience_years: number
  city: string
  about: string
  verification_status: string
  specialties: string[]
  created_at: string
}

type Tab = 'pending' | 'approved'

export default function AbogadosPage() {
  const [pending,  setPending]  = useState<Lawyer[]>([])
  const [approved, setApproved] = useState<Lawyer[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<Tab>('pending')
  const [reason,   setReason]   = useState<Record<string, string>>({})
  const [busy,     setBusy]     = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [pend, appr] = await Promise.all([
        api.get<Lawyer[]>('/admin/lawyers/pending'),
        api.get<Lawyer[]>('/lawyers'),
      ])
      setPending(pend)
      setApproved(appr as Lawyer[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function verify(id: string, status: 'approved' | 'rejected') {
    setBusy(id)
    try {
      await api.put(`/admin/lawyers/${id}/verify`, { status, reason: reason[id] })
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  const list = tab === 'pending' ? pending : approved

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      rejected: 'bg-red-50 text-red-600 border-red-100',
      pending:  'bg-amber-50 text-amber-700 border-amber-100',
    }
    const labels: Record<string, string> = { approved: 'Aprobado', rejected: 'Rechazado', pending: 'Pendiente' }
    return (
      <span className={`inline-flex text-xs px-2.5 py-0.5 rounded-full font-medium border ${map[s] ?? map.pending}`}>
        {labels[s] ?? s}
      </span>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Abogados</h1>
          <p className="text-slate-400 text-sm mt-0.5">Verificación y gestión de abogados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['pending', 'approved'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'pending' ? `Pendientes · ${pending.length}` : `Activos · ${approved.length}`}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-300 py-20 text-sm">Cargando...</div>
      ) : list.length === 0 ? (
        <div className="text-center text-slate-400 py-20 bg-white rounded-xl border border-slate-100 text-sm">
          {tab === 'pending' ? 'Sin abogados pendientes de verificación' : 'Sin abogados aprobados'}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(l => (
            <div key={l.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-base shrink-0">
                  {l.full_name[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{l.full_name}</h3>
                    {statusBadge(l.verification_status)}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{l.email}</p>

                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} strokeWidth={1.75} />
                      {l.city || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash size={11} strokeWidth={1.75} />
                      {l.colegiacion_number || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap size={11} strokeWidth={1.75} />
                      {l.experience_years} años
                    </span>
                  </div>

                  {l.specialties?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {l.specialties.map(s => (
                        <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {l.about && (
                    <p className="mt-2 text-slate-400 text-xs line-clamp-2 leading-relaxed">{l.about}</p>
                  )}
                </div>

                {/* Actions — solo pendientes */}
                {tab === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0 min-w-[160px]">
                    <input
                      type="text"
                      placeholder="Motivo rechazo (opcional)"
                      value={reason[l.id] || ''}
                      onChange={e => setReason(r => ({ ...r, [l.id]: e.target.value }))}
                      className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <button
                      onClick={() => verify(l.id, 'approved')}
                      disabled={busy === l.id}
                      className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle size={13} />
                      Aprobar
                    </button>
                    <button
                      onClick={() => verify(l.id, 'rejected')}
                      disabled={busy === l.id}
                      className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <XCircle size={13} />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
