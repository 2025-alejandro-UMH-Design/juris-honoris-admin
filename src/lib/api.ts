// All API calls go through /api/proxy — the server reads the HttpOnly cookie and adds Bearer auth.
const PROXY = '/api/proxy'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PROXY}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await res.json()
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud')
  return data as T
}

export const api = {
  get:    <T>(path: string)               => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',  body: JSON.stringify(body) }),
  delete: <T>(path: string)               => request<T>(path, { method: 'DELETE' }),
}

// Auth: call Next.js Route Handlers (not the backend directly)
export async function doLogin(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
  return data as { user: { role: string; email: string } }
}

export async function doLogout() {
  await fetch('/api/auth/logout', { method: 'POST' })
}

// isLoggedIn is client-side UX only — real protection is in middleware (HttpOnly cookie)
export function isLoggedIn() {
  if (typeof window === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('jh_admin_session='))
}

// Kept for compatibility — token is now managed server-side via HttpOnly cookie
export function saveToken(_token: string) {
  document.cookie = `jh_admin_session=1; path=/; SameSite=Strict; Secure`
}
export function clearToken() {
  document.cookie = 'jh_admin_session=; path=/; max-age=0; SameSite=Strict'
}
