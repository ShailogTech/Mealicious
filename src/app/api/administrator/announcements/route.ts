import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function POST(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'messages')
  if (error) return error
  // Only HR + SuperAdmin can broadcast announcements (matches ERP).
  if (user!.role !== 'HR' && user!.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only HR or Super Admin can post announcements' }, { status: 403 })
  }
  const body = await req.json()
  const title = String(body.title || '').trim()
  const announcementBody = String(body.body || '').trim()
  if (!title || !announcementBody) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
  }
  const created = await db.erpAnnouncement.create({
    data: {
      title,
      body: announcementBody,
      audience: body.audience ? String(body.audience) : 'all',
      fromName: user!.displayName,
    },
  })
  return NextResponse.json({ announcement: created })
}
