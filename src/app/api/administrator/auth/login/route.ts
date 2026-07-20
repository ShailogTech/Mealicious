import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { signErpSession, setErpSessionCookie } from '@/lib/erp-session'
import { limitByIp } from '@/lib/rate-limit'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  const limited = limitByIp(req, 'erp-login', 8, 15 * 60 * 1000)
  if (limited) return limited

  if (req.headers.get('content-type') !== 'application/json') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const user = await db.adminUser.findUnique({
    where: { email: normalizedEmail },
    include: { linkedEmployee: true },
  })

  // Identical message for "no user" and "bad password" to avoid user enumeration.
  const invalid = NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })

  if (!user) return invalid
  if (!user.isActive) {
    return NextResponse.json({ error: 'This account has been deactivated. Contact an administrator.' }, { status: 403 })
  }
  if (user.suspendedAt) {
    return NextResponse.json(
      { error: user.suspendedReason ? `Account suspended: ${user.suspendedReason}` : 'This account is suspended. Contact HR for details.' },
      { status: 403 },
    )
  }

  const ok = await verifyPassword(String(password), user.hashedPassword)
  if (!ok) return invalid

  // Intern date-window gate (matches ERP login() logic).
  if (user.role === 'INTERN' && user.linkedEmployee) {
    const emp = user.linkedEmployee
    const today = todayStr()
    if (emp.internshipStart && today < emp.internshipStart.toISOString().slice(0, 10)) {
      return NextResponse.json({ error: `Your internship starts on ${emp.internshipStart.toISOString().slice(0, 10)}. Login isn't active yet.` }, { status: 403 })
    }
    if (emp.internshipEnd && today > emp.internshipEnd.toISOString().slice(0, 10)) {
      return NextResponse.json({ error: `Your internship period ended on ${emp.internshipEnd.toISOString().slice(0, 10)}. Login is no longer available — contact HR.` }, { status: 403 })
    }
  }

  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  const token = await signErpSession({ email: user.email, role: user.role, userId: user.id })
  const res = NextResponse.json({ ok: true })
  setErpSessionCookie(res, token)
  return res
}
