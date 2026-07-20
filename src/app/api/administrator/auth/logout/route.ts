import { NextRequest, NextResponse } from 'next/server'
import { clearErpSessionCookie } from '@/lib/erp-session'

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true })
  clearErpSessionCookie(res)
  return res
}
