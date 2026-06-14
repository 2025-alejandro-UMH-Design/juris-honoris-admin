'use client'
import { useEffect, useState } from 'react'
import { Eye, KeyRound, Star, StarOff, X, RefreshCw, Search, Pencil, Trash2 } from 'lucide-react'
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
  auth_provider: string
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

  // Modales
  const [selected,   setSelected]   = useState<User | null>(null)
  const [resetUser,  setResetUser]  = useState<User | null>(null)
  const [editUser,   setEditUser]   = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  // Estado reset password
  const [newPwd,    setNewPwd]    = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetMsg,  setResetMsg]  = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Estado edit
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', dni: '', role: '' })
  const [saving,   setSaving]   = useState(false)
  const [editMsg,  setEditMsg]  = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Estado delete
  const [deleting, setDeleting] = useState(false)

  // Estado plan
  const [busyPlan, setBusyPlan] = useState<string | null>(null)

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

  // ── Plan ──────────────────────────────────────────────────────
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

  // ── Reset password ────────────────────────────────────────────
  function openReset(u: User) {
    setSelected(null)
    setEditUser(null)
    setResetUser(u)
    setResetMsg(null)
    setNewPwd('')
    setShowPwd(false)
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

  // ── Edit ──────────────────────────────────────────────────────
  function openEdit(u: User) {
    setSelected(null)
    setEditUser(u)
    setEditForm({ full_name: u.full_name || '', phone: u.phone || '', dni: u.dni || '', role: u.role })
    setEditMsg(null)
  }

  async function saveEdit() {
    if (!editUser) return
    setSaving(true)
    setEditMsg(null)
    try {
      const updated = await api.put<User>(`/admin/users/${editUser.id}`, {
        full_name: editForm.full_name || null,
        phone:     editForm.phone     || null,
        dni:       editForm.dni       || null,
        role:      editForm.role      || null,
      })
      setUsers(u => u.map(x => x.id === updated.id ? updated : x))
      setEditMsg({ type: 'ok', text: 'Cambios guardados correctamente.' })
    } catch (e: unknown) {
      setEditMsg({ type: 'err', text: e instanceof Error ? e.message : 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteUser) return
    setDeleting(true)
    try {
      await api.delete(`/admin/users/${deleteUser.id}`)
      setUsers(u => u.filter(x => x.id !== deleteUser.id))
      setDeleteUser(null)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
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
                {['Nombre', 'Rol', 'Plan', 'Acceso', 'Verificado', 'Registro', ''].map(h => (
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
                    {u.role === 'client' ? (
                      <button
                        onClick={() => changePlan(u.id, u.plan === 'premium' ? 'free' : 'premium')}
                        disabled={busyPlan === u.id}
                        title={u.plan === 'premium' ? 'Click para quitar Premium' : 'Click para dar Premium'}
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold border transition-all disabled:opacity-40 ${
                          u.plan === 'premium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
                        }`}
                      >
                        {u.plan === 'premium'
                          ? <Star size={11} className="fill-amber-500 text-amber-500" />
                          : <StarOff size={11} />
                        }
                        {u.plan === 'premium' ? 'Premium' : 'Gratuito'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.auth_provider === 'google' ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-red-50 text-red-600 border border-red-100">
                        <svg width="11" height="11" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Email
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${u.is_verified ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setSelected(u)}
                        title="Ver información"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(u)}
                        title="Editar usuario"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => openReset(u)}
                        title="Resetear contraseña"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-orange-50 hover:text-orange-600 transition-all"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteUser(u)}
                        title="Eliminar usuario"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
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
                <Field label="Acceso"         value={selected.auth_provider === 'google' ? 'Google OAuth' : 'Email / Contraseña'} />
                <Field label="Teléfono"       value={selected.phone} />
                <Field label="DNI"            value={selected.dni} />
                <Field label="Verificado"     value={selected.is_verified ? 'Sí' : 'No'} />
                <Field label="Consultas/mes"  value={String(selected.solicitations_this_month)} />
                <Field label="Registro"       value={formatDate(selected.created_at)} />
                <Field label="Actualizado"    value={formatDate(selected.updated_at)} />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => openEdit(selected)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all"
                >
                  <Pencil size={14} />
                  Editar
                </button>
                {selected.role === 'client' && (
                  <button
                    disabled={busyPlan === selected.id}
                    onClick={() => changePlan(selected.id, selected.plan === 'premium' ? 'free' : 'premium')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-all"
                  >
                    <Star size={14} />
                    {selected.plan === 'premium' ? 'Quitar Premium' : 'Dar Premium'}
                  </button>
                )}
                <button
                  onClick={() => openReset(selected)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all"
                >
                  <KeyRound size={14} />
                  Resetear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal editar usuario ───────────────────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Editar usuario</h2>
              <button onClick={() => setEditUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold shrink-0">
                  {(editUser.full_name || editUser.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{editUser.full_name || '—'}</p>
                  <p className="text-xs text-slate-400">{editUser.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nombre completo</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">DNI</label>
                  <input
                    type="text"
                    value={editForm.dni}
                    onChange={e => setEditForm(f => ({ ...f, dni: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Rol</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all bg-white"
                  >
                    <option value="client">Cliente</option>
                    <option value="lawyer">Abogado</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {editMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm ${
                  editMsg.type === 'ok'
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                    : 'bg-red-50 border border-red-100 text-red-600'
                }`}>
                  {editMsg.text}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditUser(null)}
                  className="flex-1 py-2.5 text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-brand text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Pencil size={14} />
                  {saving ? 'Guardando...' : 'Guardar cambios'}
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

      {/* ── Modal confirmar eliminación ────────────────────────────────────── */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Eliminar usuario</h2>
              <button onClick={() => setDeleteUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold shrink-0">
                  {(deleteUser.full_name || deleteUser.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{deleteUser.full_name || '—'}</p>
                  <p className="text-xs text-slate-400">{deleteUser.email}</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
                Esta acción es <strong>irreversible</strong>. Se eliminará el usuario y todos sus datos asociados.
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeleteUser(null)}
                  className="flex-1 py-2.5 text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Trash2 size={14} />
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
