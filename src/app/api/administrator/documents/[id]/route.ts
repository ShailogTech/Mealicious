import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'documents')
  if (error) return error
  const { id } = await params
  await db.erpDepartmentDocument.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
