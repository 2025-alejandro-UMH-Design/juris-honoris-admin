'use client'
import { useEffect, useState } from 'react'
import { Eye, KeyRound, Star, StarOff, X, RefreshCw, Search } from 'lucide-react'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  dni: string
  role: string
  plan: string
  is_verified: boolean
  solicitations_this_month: number
  created_at: string
  updated_at: string
}

const roleLabel: Record<string, string> = { client: 'Cliente', lawyer: 'Abogado', admin: 'Admin' }
const roleStyle: Record<string, string> = {
  client: 'bg-blue-50 text-blue-700 border-blue-100',
  lawyer: 'bg-violet-50 text-violet-700 border-violet-100',
  admin:  'bg-slate-100 text-slate-600 border-slate-200',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  )
}

export default function UsuariosPage() {
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [role,    setRole]    = useState('')
  const [selected,  setSelected]  = useState<User | null>(null)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [newPwd,    setNewPwd]    = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetMsg,  setResetMsg]  = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [busyPlan,  setBusyPlan]  = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (role)   params.set('role', role)
      if (search) params.set('search', search)
      setUsers(await api.get<User[]>(`/admin/users?${params}`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [role])

  async function changePlan(id: string, plan: 'free' | 'premium') {
    setBusyPlan(id)
    try {
      await api.put(`/admin/users/${id}/plan`, { plan })
      setUsers(u => u.map(x => x.id === id ? { ...x, plan } : x))
      if (selected?.id === id) setSelected(s => s ? { ...s, plan } : s)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusyPlan(null)
    }
  }

  async function resetPassword() {
    if (!resetUser) return
    setResetting(true)
    setResetMsg(null)
    try {
      await api.put(`/admin/users/${resetUser.id}/reset-password`, { new_password: newPwd })
      setResetMsg({ type: 'ok', text: 'Contraseña actualizada correctamente.' })
      setNewPwd('')
    } catch (e: unknown) {
      setResetMsg({ type: 'err', text: e instanceof Error ? e.message : 'Error al resetear' })
    } finally {
      setResetting(false)
    }
  }

  function openReset(u: User) {
    setSelected(null)
    setResetUser(u)
    setResetMsg(null)
    setNewPwd('')
    setShowPwd(false)
  }

  const filtered = search
    ? users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Usuarios</h1>
        <p className="text-slate-400 text-sm mt-0.5">Gestión de cuentas registradas en la plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">Todos los roles</option>
          <option value="client">Clientes</option>
          <option value="lawyer">Abogados</option>
          <option value="admin">Admins</option>
        </select>
        <button onClick={load} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center text-slate-300 py-16 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16 text-sm">Sin resultados</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Nombre', 'Rol', 'Plan', 'Verificado', 'Registro', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold shrink-0">
                        {(u.full_name || u.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{u.full_name || '—'}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${roleStyle[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                      u.plan === 'premium'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {u.plan === 'premium' ? 'Premium' : 'Gratuito'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${u.is_verified ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setSelected(u)}
                        title="Ver información"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openReset(u)}
                        title="Resetear contraseña"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-orange-50 hover:text-orange-600 transition-all"
                      >
                        <KeyRound size={14} />
                      </button>
                      {u.role === 'client' && (
                        <button
                          onClick={() => changePlan(u.id, u.plan === 'premium' ? 'free' : 'premium')}
                          disabled={busyPlan === u.id}
                          title={u.plan === 'premium' ? 'Quitar Premium' : 'Dar Premium'}
                          className={`p-1.5 rounded-lg transition-all disabled:opacity-40 ${
                            u.plan === 'premium'
                              ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-700'
                              : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500'
                          }`}
                        >
                          {u.plan === 'premium' ? <StarOff size={14} /> : <Star size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal detalle ──────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Información del usuario</h2>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-base">
                  {(selected.full_name || selected.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{selected.full_name || '—'}</p>
                  <p className="text-xs text-slate-400">{selected.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Rol"            value={roleLabel[selected.role]} />
                <Field label="Plan"           value={selected.plan === 'premium' ? 'Premium' : 'Gratuito'} />
                <Field label="Teléfono"       value={selected.phone} />
                <Field label="DNI"            value={selected.dni} />
                <Field label="Verificado"     value={selected.is_verified ? 'Sí' : 'No'} />
                <Field label="Consultas/mes"  value={String(selected.solicitations_this_month)} />
                <Field label="Registro"       value={formatDate(selected.created_at)} />
                <Field label="Actualizado"    value={formatDate(selected.updated_at)} />
              </div>

              <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-xs text-slate-500">
                <KeyRound size={13} className="mt-0.5 shrink-0 text-slate-400" />
                La contraseña está cifrada con bcrypt. Usa el botón de reseteo para establecer una nueva.
              </div>

              <div className="flex gap-2 pt-1">
                {selected.role === 'client' && (
                  <button
                    disabled={busyPlan === selected.id}
                    onClick={() => changePlan(selected.id, selected.plan === 'premium' ? 'free' : 'premium')}
                    className="flex-1 py-2 text-sm font-medium rounded-xl border border-brand text-brand hover:bg-brand hover:text-white disabled:opacity-50 transition-all"
                  >
                    {selected.plan === 'premium' ? 'Quitar Premium' : 'Dar Premium'}
                  </button>
                )}
                <button
                  onClick={() => openReset(selected)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all"
                >
                  <KeyRound size={14} />
                  Resetear contraseña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal reset contraseña ─────────────────────────────────────────── */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Resetear contraseña</h2>
              <button onClick={() => setResetUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold shrink-0">
                  {(resetUser.full_name || resetUser.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{resetUser.full_name || '—'}</p>
                  <p className="text-xs text-slate-400">{resetUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Eye size={15} />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  El usuario usará esta contraseña en su próximo inicio de sesión.
                </p>
              </div>

              {resetMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm ${
                  resetMsg.type === 'ok'
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                    : 'bg-red-50 border border-red-100 text-red-600'
                }`}>
                  {resetMsg.text}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setResetUser(null)}
                  className="flex-1 py-2.5 text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={resetPassword}
                  disabled={resetting || newPwd.length < 6}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <KeyRound size={14} />
                  {resetting ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
