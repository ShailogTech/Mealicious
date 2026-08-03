import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'expenses')
  if (error) return error
  const rows = await db.erpExpense.findMany({ orderBy: { date: 'desc' } })
  return NextResponse.json({ expenses: rows })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'expenses')
  if (error) return error

  try {
    const formData = await req.formData()
    const category = String(formData.get('category') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const amount = Number(formData.get('amount') || 0)
    const vendor = String(formData.get('vendor') || '').trim()
    const paymentMode = String(formData.get('paymentMode') || 'Bank Transfer').trim()
    const dateRaw = String(formData.get('date') || '').trim()
    const file = formData.get('file') as File | null

    if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    if (!amount || amount <= 0) return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 })

    let documentUrl: string | null = null
    let documentName: string | null = null
    if (file) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 9)
      const originalExt = path.extname(file.name) || ''
      const filename = `${uniqueId}${originalExt}`

      const uploadDir = path.join(process.cwd(), 'public', 'erp-expenses')
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), buffer)

      documentUrl = `/erp-expenses/${filename}`
      documentName = file.name
    }

    const created = await db.erpExpense.create({
      data: {
        category,
        description,
        amount,
        date: dateRaw ? new Date(dateRaw) : new Date(),
        vendor: vendor || null,
        paymentMode: paymentMode || 'Bank Transfer',
        status: 'Pending',
        documentUrl,
        documentName,
        createdBy: user!.displayName,
      },
    })
    return NextResponse.json({ expense: created })
  } catch (e) {
    return NextResponse.json({ error: 'Expense creation failed' }, { status: 500 })
  }
}
