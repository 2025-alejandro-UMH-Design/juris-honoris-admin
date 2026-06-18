import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.API_URL || 'http://localhost:3000/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const backendRes = await fetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await backendRes.json()
    if (!backendRes.ok) return NextResponse.json(data, { status: backendRes.status })

    if (data.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado. Solo administradores.' }, { status: 403 })
    }

    const response = NextResponse.json({ user: data.user })
    response.cookies.set('jh_admin_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
