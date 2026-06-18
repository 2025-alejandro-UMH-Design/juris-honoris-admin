const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('jh_admin_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud')
  return data as T
}

export const api = {
  get:    <T>(path: string)              => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',  body: JSON.stringify(body) }),
  delete: <T>(path: string)              => request<T>(path, { method: 'DELETE' }),
}

// Auth helpers
export function saveToken(token: string) {
  localStorage.setItem('jh_admin_token', token)
  // Session cookie for server-side middleware check (not HttpOnly — set from JS)
  document.cookie = `jh_admin_session=1; path=/; SameSite=Strict; Secure`
}
export function clearToken() {
  localStorage.removeItem('jh_admin_token')
  document.cookie = 'jh_admin_session=; path=/; max-age=0; SameSite=Strict'
}
export function isLoggedIn() {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('jh_admin_token')
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const valid = payload.exp * 1000 > Date.now() && payload.role === 'admin'
    if (!valid) clearToken()
    return valid
  } catch {
    return false
  }
}
