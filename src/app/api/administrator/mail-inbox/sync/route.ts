import { NextRequest, NextResponse } from 'next/server'
import { requireErpRole } from '@/lib/erp-session'
import { pollMailboxes, isMailSyncConfigured } from '@/lib/mail-sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Trigger an IMAP poll of the company mailboxes. Any role with the
 * mailinbox permission can trigger it; results are per-mailbox.
 */
export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'mailinbox')
  if (error) return error

  if (!isMailSyncConfigured()) {
    return NextResponse.json(
      { error: 'Mail sync not configured. Set ERP_MAILBOXES (JSON array of {email, password}) in the environment.' },
      { status: 503 },
    )
  }

  const results = await pollMailboxes()
  const total = results.reduce((s, r) => s + r.fetched, 0)
  const failed = results.filter((r) => r.error)
  return NextResponse.json({ ok: failed.length === 0, totalFetched: total, results })
}
