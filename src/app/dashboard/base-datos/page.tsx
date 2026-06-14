'use client'
import { useEffect, useState } from 'react'
import { Database, RefreshCw, ArrowLeftRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface DBInfo {
  configured: boolean
  connected: boolean
}

interface DBStatus {
  active: 'primary' | 'backup'
  primary: DBInfo
  backup: DBInfo
}

function StatusBadge({ info, isActive }: { info: DBInfo; isActive: boolean }) {
  if (!info.configured) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <AlertCircle size={13} />
        No configurada
      </span>
    )
  }
  if (!info.connected) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
        <XCircle size={13} />
        Sin conexión
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
      <CheckCircle2 size={13} />
      {isActive ? 'Activa · Conectada' : 'Conectada'}
    </span>
  )
}

function DBCard({
  label,
  info,
  isActive,
  canSwitch,
  switching,
  onSwitch,
}: {
  label: string
  info: DBInfo
  isActive: boolean
  canSwitch: boolean
  switching: boolean
  onSwitch: () => void
}) {
  return (
    <div className={`bg-white rounded-xl border-2 p-5 transition-all ${
      isActive ? 'border-brand shadow-sm' : 'border-slate-100'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isActive ? 'bg-brand/10' : 'bg-slate-50'
          }`}>
            <Database size={18} className={isActive ? 'text-brand' : 'text-slate-400'} strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800 text-sm">{label}</p>
              {isActive && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                  En uso
                </span>
              )}
            </div>
            <div className="mt-1">
              <StatusBadge info={info} isActive={isActive} />
            </div>
          </div>
        </div>

        {!isActive && canSwitch && (
          <button
            onClick={onSwitch}
            disabled={switching || !info.configured || !info.connected}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <ArrowLeftRight size={13} />
            {switching ? 'Cambiando...' : 'Usar esta'}
          </button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Estado</p>
          <p className="text-xs text-slate-600 mt-0.5">
            {!info.configured ? 'Sin configurar' : info.connected ? 'Online' : 'Offline'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Rol</p>
          <p className="text-xs text-slate-600 mt-0.5">{isActive ? 'Principal activa' : 'Respaldo'}</p>
        </div>
      </div>
    </div>
  )
}

export default function BaseDatosPage() {
  const [status,    setStatus]    = useState<DBStatus | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [switching, setSwitching] = useState(false)
  const [feedback,  setFeedback]  = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function fetchStatus() {
    setLoading(true)
    try {
      const data = await api.get<DBStatus>('/admin/db-status')
      setStatus(data)
    } catch {
      setFeedback({ type: 'err', text: 'No se pudo obtener el estado de las bases de datos.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  async function switchTo(target: 'primary' | 'backup') {
    if (!status) return
    setSwitching(true)
    setFeedback(null)
    try {
      const res = await api.post<{ message: string; active: string }>('/admin/db-switch', { target })
      setFeedback({ type: 'ok', text: res.message })
      await fetchStatus()
    } catch (e: unknown) {
      setFeedback({ type: 'err', text: e instanceof Error ? e.message : 'Error al cambiar la base de datos' })
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Base de Datos</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gestión de conexiones primaria y de respaldo</p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {feedback && (
        <div className={`px-4 py-3 rounded-xl text-sm ${
          feedback.type === 'ok'
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
            : 'bg-red-50 border border-red-100 text-red-600'
        }`}>
          {feedback.text}
        </div>
      )}

      {loading && !status ? (
        <div className="text-slate-300 py-20 text-center text-sm">Verificando conexiones...</div>
      ) : status ? (
        <div className="space-y-3">
          <DBCard
            label="Base de Datos Primaria"
            info={status.primary}
            isActive={status.active === 'primary'}
            canSwitch={status.active !== 'primary'}
            switching={switching}
            onSwitch={() => switchTo('primary')}
          />
          <DBCard
            label="Base de Datos Respaldo"
            info={status.backup}
            isActive={status.active === 'backup'}
            canSwitch={status.active !== 'backup'}
            switching={switching}
            onSwitch={() => switchTo('backup')}
          />
        </div>
      ) : null}

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Nota:</span> Al cambiar de base de datos, el servidor reconecta inmediatamente.
          Las sesiones activas continúan sin interrupción. El cambio persiste hasta el próximo reinicio del servidor,
          donde volverá a la DB configurada en <code className="bg-amber-100 px-1 rounded font-mono">DATABASE_ACTIVE</code>.
        </p>
      </div>
    </div>
  )
}
