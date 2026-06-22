'use client'
import { useEffect, useState } from 'react'
import { HardDrive, Image, FileText, Users, RefreshCw, Shield } from 'lucide-react'
import { api } from '@/lib/api'

interface UserStorage {
  id: string
  full_name: string
  email: string
  role: 'client' | 'lawyer'
  total_files: number
  total_bytes: number
  image_count: number
  image_bytes: number
  doc_count: number
  doc_bytes: number
  last_upload: string | null
}

interface StorageData {
  cloudinary: {
    storage_used: number
    storage_limit: number
    bandwidth_used: number
    plan: string
  }
  per_user: UserStorage[]
  totals: {
    total_files: number
    total_bytes: number
    image_count: number
    image_bytes: number
    doc_count: number
    doc_bytes: number
  }
}

function fmtBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AlmacenamientoPage() {
  const [data,    setData]    = useState<StorageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setData(await api.get<StorageData>('/admin/storage'))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = (data?.per_user ?? []).filter(u =>
    !search ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const storagePercent = data
    ? Math.min(100, Math.round((data.cloudinary.storage_used / (data.cloudinary.storage_limit || 1)) * 100))
    : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Almacenamiento</h1>
          <p className="text-slate-400 text-sm mt-0.5">Uso de almacenamiento por usuario</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Aviso de privacidad */}
      <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Shield size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-blue-700 text-xs leading-relaxed">
          Esta vista muestra únicamente estadísticas de uso (cantidad y tamaño de archivos). El contenido de los archivos es privado y pertenece exclusivamente a cada usuario — no es accesible desde el panel administrativo.
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={HardDrive}
          label="Espacio en Cloudinary"
          value={loading ? '—' : fmtBytes(data?.cloudinary.storage_used ?? 0)}
          sub={loading ? '' : `de ${fmtBytes(data?.cloudinary.storage_limit ?? 0)} · Plan ${data?.cloudinary.plan}`}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={Users}
          label="Usuarios con archivos"
          value={loading ? '—' : String(data?.per_user.length ?? 0)}
          sub={`${data?.totals.total_files ?? 0} archivos en total`}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <StatCard
          icon={Image}
          label="Imágenes"
          value={loading ? '—' : String(data?.totals.image_count ?? 0)}
          sub={fmtBytes(data?.totals.image_bytes ?? 0)}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          icon={FileText}
          label="Documentos"
          value={loading ? '—' : String(data?.totals.doc_count ?? 0)}
          sub={fmtBytes(data?.totals.doc_bytes ?? 0)}
          color="text-slate-600"
          bg="bg-slate-100"
        />
      </div>

      {/* Barra de uso Cloudinary */}
      {data && data.cloudinary.storage_limit > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">Capacidad utilizada en Cloudinary</span>
            <span className="text-xs text-slate-400">{storagePercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${storagePercent > 80 ? 'bg-red-500' : storagePercent > 50 ? 'bg-amber-400' : 'bg-blue-500'}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-slate-400">{fmtBytes(data.cloudinary.storage_used)} usados</span>
            <span className="text-xs text-slate-400">{fmtBytes(data.cloudinary.storage_limit)} totales</span>
          </div>
        </div>
      )}

      {/* Tabla por usuario */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Uso por usuario</h2>
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-300 w-48"
          />
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="w-32 h-3.5 bg-slate-100 rounded animate-pulse" />
                <div className="w-20 h-3.5 bg-slate-100 rounded animate-pulse" />
                <div className="w-16 h-3.5 bg-slate-100 rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            {search ? 'No se encontraron usuarios' : 'Ningún usuario ha subido archivos aún'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left bg-slate-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Imágenes</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Documentos</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Total archivos</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Espacio usado</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Último archivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800 text-sm">{u.full_name}</p>
                    <p className="text-slate-400 text-xs">{u.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${u.role === 'lawyer' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}>
                      {u.role === 'lawyer' ? 'Abogado' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <p className="text-slate-700 font-medium">{u.image_count}</p>
                    <p className="text-slate-400 text-xs">{fmtBytes(Number(u.image_bytes))}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <p className="text-slate-700 font-medium">{u.doc_count}</p>
                    <p className="text-slate-400 text-xs">{fmtBytes(Number(u.doc_bytes))}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-slate-700 font-semibold">{u.total_files}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-slate-700 font-semibold">{fmtBytes(Number(u.total_bytes))}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-slate-400">
                    {fmtDate(u.last_upload)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de totales */}
            {filtered.length > 1 && !search && data && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-5 py-3 text-xs font-bold text-slate-600 uppercase" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-center">
                    <p className="text-slate-700 font-bold text-sm">{data.totals.image_count}</p>
                    <p className="text-slate-400 text-xs">{fmtBytes(data.totals.image_bytes)}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <p className="text-slate-700 font-bold text-sm">{data.totals.doc_count}</p>
                    <p className="text-slate-400 text-xs">{fmtBytes(data.totals.doc_bytes)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-700 font-bold text-sm">{data.totals.total_files}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-700 font-bold text-sm">{fmtBytes(data.totals.total_bytes)}</span>
                  </td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  color: string
  bg: string
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg} mb-4`}>
        <Icon size={17} className={color} strokeWidth={1.75} />
      </div>
      <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
      <p className="text-slate-400 text-xs mt-1.5 leading-tight">{label}</p>
      {sub && <p className="text-slate-300 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}
