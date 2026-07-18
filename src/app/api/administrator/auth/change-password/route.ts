import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'
import { getErpSessionUser } from '@/lib/erp-session'

/**
 * Change the current user's password. Requires the current password to be
 * supplied (re-authentication), and enforces a minimum length on the new one.
 */
export async function POST(req: NextRequest) {
  const user = await getErpSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const currentPassword = String(body.currentPassword || '')
  const newPassword = String(body.newPassword || '')

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: 'New password must differ from the current one' }, { status: 400 })
  }

  const ok = await verifyPassword(currentPassword, user.hashedPassword)
  if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })

  await db.adminUser.update({
    where: { id: user.id },
    data: { hashedPassword: await hashPassword(newPassword) },
  })
  return NextResponse.json({ ok: true })
}
