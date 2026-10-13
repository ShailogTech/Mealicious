import { NextRequest, NextResponse } from 'next/server'
import { requireErpRole } from '@/lib/erp-session'
import { pollMailboxes, isMailSyncConfigured, getSyncStatus, startPoll } from '@/lib/mail-sync'

export const dynamic = 'force-dynamic'

/**
 * Mail sync control.
 *
 * POST — kick off a background IMAP poll. Returns immediately (the poll can
 *        outlive Cloudflare's 100s HTTP limit, so the request must not wait).
 * GET  — current sync status + last results (for the admin UI to poll).
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

  const status = getSyncStatus()
  if (status.running) {
    return NextResponse.json({ ok: true, started: true, alreadyRunning: true, startedAt: status.startedAt })
  }

  startPoll()
  return NextResponse.json({ ok: true, started: true, startedAt: new Date().toISOString() })
}

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'mailinbox')
  if (error) return error

  const status = getSyncStatus()
  return NextResponse.json({
    running: status.running,
    startedAt: status.startedAt,
    finishedAt: status.finishedAt,
    results: status.results,
  })
}
