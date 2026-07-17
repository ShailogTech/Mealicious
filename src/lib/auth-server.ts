import { jwtVerify, createRemoteJWKSet } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './admin-session'
import { db } from './db'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@mealicious.com')
  .toLowerCase()
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

export interface AuthUser {
  uid: string
  email: string
  isAdmin: boolean
}

export async function verifyFirebaseToken(authHeader: string | null): Promise<AuthUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  if (!token || !PROJECT_ID) return null
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    })
    const email = String(payload.email || '').toLowerCase()
    if (!email) return null
    return {
      uid: String(payload.sub || payload.user_id || ''),
      email,
      isAdmin: ADMIN_EMAILS.includes(email),
    }
  } catch {
    return null
  }
}

export async function requireAdmin(req: Request) {
  // Try admin-session cookie first (most reliable for browser requests)
  const session = await getSessionFromRequest(req)
  if (session && ADMIN_EMAILS.includes(session.email.toLowerCase())) {
    return {
      user: { uid: 'session-admin', email: session.email, isAdmin: true } as AuthUser,
      error: null as NextResponse | null,
    }
  }
  // ERP SUPER_ADMIN path (additive): an active SUPER_ADMIN AdminUser also
  // qualifies as a store admin via the shared admin-session cookie. The env
  // path above is checked first and unchanged, so this can never regress /admin.
  if (session) {
    try {
      const erpUser = await db.adminUser.findUnique({ where: { email: session.email.toLowerCase() } })
      if (erpUser?.isActive && erpUser.role === 'SUPER_ADMIN') {
        return {
          user: { uid: erpUser.id, email: erpUser.email, isAdmin: true } as AuthUser,
          error: null as NextResponse | null,
        }
      }
    } catch {
      // If the ERP lookup fails (e.g. table not migrated yet), fall through to
      // existing paths rather than blocking store admin access.
    }
  }
  // Stub-admin bypass: testing only, gated by ALLOW_STUB_ADMIN env flag
  if (process.env.ALLOW_STUB_ADMIN === '1') {
    const stub = req.headers.get('x-admin-stub')
    if (stub) {
      const email = stub.split(':')[0]?.toLowerCase().trim()
      if (email && ADMIN_EMAILS.includes(email)) {
        return {
          user: { uid: 'stub-admin', email, isAdmin: true } as AuthUser,
          error: null as NextResponse | null,
        }
      }
    }
  }
  // Firebase token fallback
  const user = await verifyFirebaseToken(req.headers.get('authorization'))
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!user.isAdmin) return { user, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function requireAdminSession(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { session, error: null }
}
