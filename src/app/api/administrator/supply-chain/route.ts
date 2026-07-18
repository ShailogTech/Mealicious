import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'supplychain')
  if (error) return error
  const rows = await db.erpShipment.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ shipments: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'supplychain')
  if (error) return error
  const body = await req.json()
  const fromLocation = String(body.from || '').trim()
  const toLocation = String(body.to || '').trim()
  if (!fromLocation || !toLocation) return NextResponse.json({ error: 'Origin and destination are required' }, { status: 400 })
  const created = await db.erpShipment.create({
    data: {
      fromLocation,
      toLocation,
      vehicle: String(body.vehicle || ''),
      status: body.status || 'Dispatched',
      eta: body.eta ? new Date(body.eta) : null,
    },
  })
  return NextResponse.json({ shipment: created })
}
