import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND = process.env.API_URL || 'http://localhost:3000/api'

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('jh_admin_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const backendPath = params.path.join('/')
  const { search } = new URL(req.url)
  const backendUrl = `${BACKEND}/${backendPath}${search}`

  const isJson = (req.headers.get('content-type') || '').includes('application/json')
  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? (isJson ? await req.text() : undefined)
    : undefined

  try {
    const backendRes = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
    })
    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch {
    return NextResponse.json({ error: 'Error al conectar con el servidor' }, { status: 502 })
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
}
