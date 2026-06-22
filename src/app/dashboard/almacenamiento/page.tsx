'use client'
import { useEffect, useState } from 'react'
import { HardDrive, Image, FileText, RefreshCw, ExternalLink, LayoutGrid, List } from 'lucide-react'
import { api } from '@/lib/api'

interface CloudinaryFile {
  public_id: string
  url: string
  format: string
  size_bytes: number
  width: number | null
  height: number | null
  created_at: string
  folder: string
}

interface StorageData {
  usage: {
    storage_used: number
    storage_limit: number
    bandwidth_used: number
    resources_count: number
    plan: string
  }
  images: CloudinaryFile[]
  documents: CloudinaryFile[]
}

type Tab = 'todos' | 'imagenes' | 'documentos'
type View = 'grid' | 'list'

function fmtBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function shortId(public_id: string) {
  const parts = public_id.split('/')
  return parts[parts.length - 1]
}

export default function AlmacenamientoPage() {
  const [data,    setData]    = useState<StorageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [tab,     setTab]     = useState<Tab>('todos')
  const [view,    setView]    = useState<View>('grid')
  const [search,  setSearch]  = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get<StorageData>('/admin/storage')
      setData(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const allFiles: (CloudinaryFile & { type: 'imagen' | 'documento' })[] = [
    ...(data?.images    ?? []).map(f => ({ ...f, type: 'imagen'    as const })),
    ...(data?.documents ?? []).map(f => ({ ...f, type: 'documento' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filtered = allFiles.filter(f => {
    if (tab === 'imagenes'   && f.type !== 'imagen')    return false
    if (tab === 'documentos' && f.type !== 'documento') return false
    if (search && !f.public_id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const storagePercent = data
    ? Math.min(100, Math.round((data.usage.storage_used / (data.usage.storage_limit || 1)) * 100))
    : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Almacenamiento</h1>
          <p className="text-slate-400 text-sm mt-0.5">Archivos almacenados en Cloudinary</p>
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

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={HardDrive}
          label="Espacio usado"
          value={loading ? '—' : fmtBytes(data?.usage.storage_used ?? 0)}
          sub={loading ? '' : `de ${fmtBytes(data?.usage.storage_limit ?? 0)} (${storagePercent}%)`}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={Image}
          label="Imágenes"
          value={loading ? '—' : String(data?.images.length ?? 0)}
          sub="archivos de imagen"
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <StatCard
          icon={FileText}
          label="Documentos"
          value={loading ? '—' : String(data?.documents.length ?? 0)}
          sub="PDFs y archivos raw"
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          icon={HardDrive}
          label="Ancho de banda"
          value={loading ? '—' : fmtBytes(data?.usage.bandwidth_used ?? 0)}
          sub={`Plan ${data?.usage.plan ?? '—'}`}
          color="text-slate-600"
          bg="bg-slate-100"
        />
      </div>

      {/* Storage bar */}
      {data && data.usage.storage_limit > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">Uso de almacenamiento</span>
            <span className="text-xs text-slate-400">{storagePercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${storagePercent > 80 ? 'bg-red-500' : storagePercent > 50 ? 'bg-amber-400' : 'bg-blue-500'}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-slate-400">{fmtBytes(data.usage.storage_used)} usados</span>
            <span className="text-xs text-slate-400">{fmtBytes(data.usage.storage_limit)} disponibles</span>
          </div>
        </div>
      )}

      {/* Tabs + search + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {(['todos', 'imagenes', 'documentos'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'todos' ? `Todos (${allFiles.length})` : t === 'imagenes' ? `Imágenes (${data?.images.length ?? 0})` : `Documentos (${data?.documents.length ?? 0})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-300 w-52"
          />
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* File list */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">No hay archivos en esta categoría</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(f => (
            <FileCard key={f.public_id} file={f} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Archivo</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tamaño</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Carpeta</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.public_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {f.type === 'imagen' ? (
                        <img src={f.url} alt="" className="w-8 h-8 rounded object-cover bg-slate-100 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-amber-500" />
                        </div>
                      )}
                      <span className="text-slate-700 font-medium truncate max-w-[180px]">{shortId(f.public_id)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${f.type === 'imagen' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'}`}>
                      {f.format.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtBytes(f.size_bytes)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(f.created_at)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{f.folder || '/'}</td>
                  <td className="px-4 py-3">
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
      <p className="text-slate-400 text-xs mt-1.5">{label}</p>
      {sub && <p className="text-slate-300 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

function FileCard({ file }: { file: CloudinaryFile & { type: 'imagen' | 'documento' } }) {
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className="group bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all"
    >
      {/* Preview */}
      <div className="h-28 bg-slate-50 flex items-center justify-center overflow-hidden">
        {file.type === 'imagen' ? (
          <img src={file.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <FileText size={28} className="text-amber-400" strokeWidth={1.5} />
            <span className="text-xs font-bold text-amber-500 uppercase">{file.format}</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-medium text-slate-700 truncate">{shortId(file.public_id)}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-400">{fmtBytes(file.size_bytes)}</span>
          <span className="text-xs text-slate-300">{fmtDate(file.created_at)}</span>
        </div>
        {file.folder && (
          <p className="text-xs text-slate-300 mt-0.5 truncate">/{file.folder}</p>
        )}
      </div>
    </a>
  )
}
