'use client'
import { useEffect, useState } from 'react'
import { Settings, Brain, Eye, EyeOff, PlayCircle, Save, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'

const PROVIDERS = [
  { key: 'groq',      name: 'Groq',              model: 'llama-3.3-70b-versatile',    hint: 'Gratis · Rápido' },
  { key: 'anthropic', name: 'Claude (Anthropic)', model: 'claude-3-5-haiku-20241022', hint: 'Alta calidad' },
  { key: 'openai',    name: 'OpenAI',             model: 'gpt-4o-mini',               hint: 'Ampliamente usado' },
  { key: 'deepseek',  name: 'DeepSeek',           model: 'deepseek-chat',             hint: 'Bajo costo' },
]

interface AIConfig {
  active_provider: string
  api_key: string
  model: string
  master_prompt: string
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-brand/8 flex items-center justify-center">
        <Icon size={16} className="text-brand" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  )
}

function Feedback({ msg }: { msg: { type: 'ok' | 'err'; text: string } | null }) {
  if (!msg) return null
  return (
    <div className={`px-4 py-3 rounded-xl text-sm ${
      msg.type === 'ok'
        ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
        : 'bg-red-50 border border-red-100 text-red-600'
    }`}>
      {msg.text}
    </div>
  )
}

export default function IAConfigPage() {
  const [config,       setConfig]       = useState<AIConfig>({ active_provider: 'groq', api_key: '', model: '', master_prompt: '' })
  const [loading,      setLoading]      = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingPrompt, setSavingPrompt] = useState(false)
  const [testing,      setTesting]      = useState(false)
  const [showKey,      setShowKey]      = useState(false)
  const [msgConfig,    setMsgConfig]    = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [msgPrompt,    setMsgPrompt]    = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    api.get<AIConfig>('/admin/ai-config')
      .then(setConfig)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const provider = PROVIDERS.find(p => p.key === config.active_provider) ?? PROVIDERS[0]

  async function saveProviderConfig() {
    setSavingConfig(true)
    setMsgConfig(null)
    try {
      await api.put('/admin/ai-config', { active_provider: config.active_provider, api_key: config.api_key, model: config.model })
      setMsgConfig({ type: 'ok', text: 'Configuración guardada.' })
    } catch (e: unknown) {
      setMsgConfig({ type: 'err', text: e instanceof Error ? e.message : 'Error' })
    } finally {
      setSavingConfig(false)
    }
  }

  async function saveMasterPrompt() {
    setSavingPrompt(true)
    setMsgPrompt(null)
    try {
      await api.put('/admin/ai-config', { active_provider: config.active_provider, master_prompt: config.master_prompt })
      setMsgPrompt({ type: 'ok', text: 'Master Prompt guardado. Todos los chats usarán este prompt.' })
    } catch (e: unknown) {
      setMsgPrompt({ type: 'err', text: e instanceof Error ? e.message : 'Error' })
    } finally {
      setSavingPrompt(false)
    }
  }

  async function test() {
    setTesting(true)
    setMsgConfig(null)
    try {
      const res = await api.post<{ ok: boolean; response: string }>('/admin/ai-config/test', config)
      setMsgConfig({ type: 'ok', text: `Conexión exitosa · "${res.response}"` })
    } catch (e: unknown) {
      setMsgConfig({ type: 'err', text: e instanceof Error ? e.message : 'Error en prueba' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="text-slate-300 py-20 text-center text-sm">Cargando...</div>

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Configuración de IA</h1>
        <p className="text-slate-400 text-sm mt-0.5">Proveedor y personalidad del asistente Juris</p>
      </div>

      {/* ── Proveedor ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <SectionHeader icon={Settings} title="Proveedor de IA" description="API key y modelo activo" />

        <div className="grid grid-cols-2 gap-2.5">
          {PROVIDERS.map(p => (
            <button
              key={p.key}
              onClick={() => setConfig(c => ({ ...c, active_provider: p.key, model: p.model }))}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                config.active_provider === p.key
                  ? 'border-brand bg-brand/5'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <p className="font-semibold text-sm text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.hint}</p>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              API Key — {provider.name}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.api_key}
                onChange={e => setConfig(c => ({ ...c, api_key: e.target.value }))}
                placeholder="Pega tu API key aquí"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Almacenada en la base de datos. Nunca se envía al dispositivo móvil.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Modelo
            </label>
            <input
              type="text"
              value={config.model || provider.model}
              onChange={e => setConfig(c => ({ ...c, model: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">Por defecto: {provider.model}</p>
          </div>
        </div>

        <Feedback msg={msgConfig} />

        <div className="flex gap-2.5">
          <button
            onClick={saveProviderConfig}
            disabled={savingConfig || !config.api_key}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save size={14} />
            {savingConfig ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={test}
            disabled={testing || !config.api_key}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <PlayCircle size={14} />
            {testing ? 'Probando...' : 'Probar conexión'}
          </button>
        </div>
      </div>

      {/* ── Master Prompt ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <SectionHeader icon={Brain} title="Master Prompt" description="Instrucciones que definen el comportamiento de Juris" />

        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" strokeWidth={2} />
          <p className="text-xs text-amber-700 leading-relaxed">
            Este prompt se envía en cada conversación. Los cambios aplican a todos los usuarios inmediatamente.
            Mantén siempre la instrucción del indicador{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">[NECESITA_ABOGADO: SI/NO]</code>
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            System prompt para Juris
          </label>
          <textarea
            value={config.master_prompt}
            onChange={e => setConfig(c => ({ ...c, master_prompt: e.target.value }))}
            rows={18}
            placeholder="Escribe aquí las instrucciones del sistema para el asistente legal..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand resize-y transition-all"
          />
          <p className="text-xs text-slate-400 mt-1.5 text-right">
            {config.master_prompt.length.toLocaleString()} caracteres
          </p>
        </div>

        <Feedback msg={msgPrompt} />

        <button
          onClick={saveMasterPrompt}
          disabled={savingPrompt || !config.master_prompt.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Save size={14} />
          {savingPrompt ? 'Guardando...' : 'Guardar Master Prompt'}
        </button>
      </div>
    </div>
  )
}
