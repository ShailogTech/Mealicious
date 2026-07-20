import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * ERP (/administrator) auth layer.
 *
 * Reuses the SAME 'admin-session' cookie + signing secret as the store admin
 * (src/lib/admin-session.ts), so a single login can reach both /admin and
 * /administrator (Safe-B architecture). The ERP JWT payload additionally
 * carries the user's ErpRole. All writes/reads of AdminUser state (active,
 * suspended, intern date-window) are enforced here.
 */

const COOKIE_NAME = 'admin-session'
const rawSecret = process.env.ADMIN_SESSION_SECRET
const SECRET = new TextEncoder().encode(
  rawSecret && rawSecret.length >= 32 ? rawSecret : 'fallback-insecure-secret-change-in-production-min-32-chars',
)
const EXPIRY = '7d'

export interface ErpAdminSession {
  email: string
  role: 'SUPER_ADMIN' | 'FINANCE' | 'SALES' | 'OPS' | 'HR' | 'EMPLOYEE' | 'INTERN'
  userId: string
}

export async function signErpSession(payload: ErpAdminSession): Promise<string> {
  if (!rawSecret || rawSecret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be set to a strong random value (min 32 chars)')
  }
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET)
}

async function verifyErpSession(token: string): Promise<ErpAdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (!payload.email || !payload.role || !payload.userId) return null
    return {
      email: String(payload.email),
      role: payload.role as ErpAdminSession['role'],
      userId: String(payload.userId),
    }
  } catch {
    return null
  }
}

/**
 * Resolve the logged-in ERP user from the cookie, then re-check live
 * AdminUser state (must exist, be active, not be suspended). Returns the
 * AdminUser row on success, null otherwise.
 */
export async function getErpSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const session = await verifyErpSession(token)
  if (!session) return null
  const user = await db.adminUser.findUnique({
    where: { email: session.email },
    include: { linkedEmployee: true },
  })
  if (!user || !user.isActive || user.suspendedAt) return null
  return user
}

/** Cookie helper for route handlers (sets the ERP JWT into the shared cookie). */
export function setErpSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearErpSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}

/** Read the ERP session from a raw Request (route handler context). */
export async function getErpSessionFromRequest(req: Request): Promise<ErpAdminSession | null> {
  let token: string | undefined
  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    token = (req as any).cookies.get(COOKIE_NAME)?.value
  } else {
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(^|;)\\s*${COOKIE_NAME}\\s*=\\s*([^;]+)`))
      if (match) token = decodeURIComponent(match[2])
    }
  }
  if (!token) return null
  return verifyErpSession(token)
}

const SUPER_ADMIN_LOCKED = new Set(['adminusers', 'companysettings'])

export interface ErpRoleCheck {
  user: Awaited<ReturnType<typeof getErpSessionUser>>
  error: NextResponse | null
}

/**
 * Authorize an ERP API request against a module key. Enforces:
 *  - valid session + active, non-suspended AdminUser
 *  - SUPER_ADMIN bypasses everything
 *  - adminusers/companysettings hard-locked to SUPER_ADMIN
 *  - otherwise the RBAC matrix on ErpSystemConfig.permissions[moduleKey][role]
 */
export async function requireErpRole(req: Request, moduleKey: string): Promise<ErpRoleCheck> {
  const session = await getErpSessionFromRequest(req)
  if (!session) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const user = await db.adminUser.findUnique({
    where: { email: session.email },
    include: { linkedEmployee: true },
  })
  if (!user || !user.isActive || user.suspendedAt) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (user.role === 'SUPER_ADMIN') return { user, error: null }
  if (SUPER_ADMIN_LOCKED.has(moduleKey)) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  const config = await db.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
  const permissions = (config?.permissions ?? {}) as Record<string, Record<string, boolean>>
  const allowed = permissions[moduleKey]?.[user.role] ?? false
  if (!allowed) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null }
}
