import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Only auth pages/API routes need protection
// The main chat is accessible to everyone (guests included)
const AUTH_ONLY_PATHS = ['/api/conversations', '/api/auth/logout', '/api/auth/me']
const AUTH_PAGES = ['/login', '/register']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get('ai_session')?.value
  const session = token ? await verifyToken(token) : null

  // If already logged in, redirect away from login/register pages
  if (session && AUTH_PAGES.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Protect conversation endpoints (require login)
  if (AUTH_ONLY_PATHS.some(p => pathname.startsWith(p)) && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
