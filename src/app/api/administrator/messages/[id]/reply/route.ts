import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireErpRole(req, 'messages')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const text = String(body.body || '').trim()
  if (!text) return NextResponse.json({ error: 'Reply body is required' }, { status: 400 })

  const msg = await db.erpMessage.findUnique({ where: { id } })
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const replies = Array.isArray(msg.replies) ? msg.replies : []
  replies.push({ fromName: user!.displayName, body: text, date: new Date().toISOString() })
  const updated = await db.erpMessage.update({ where: { id }, data: { replies } })
  return NextResponse.json({ message: updated })
}
