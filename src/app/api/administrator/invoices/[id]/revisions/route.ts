import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

/** Revision history for one invoice — newest first. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'invoices')
  if (error) return error
  const { id } = await params
  const revisions = await db.erpInvoiceRevision.findMany({
    where: { invoiceId: id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      invoiceNumber: true,
      editedBy: true,
      editReason: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ revisions, count: revisions.length })
}
