import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'documents')
  if (error) return error
  const rows = await db.erpDepartmentDocument.findMany({ orderBy: [{ dept: 'asc' }, { createdAt: 'desc' }] })
  return NextResponse.json({ documents: rows })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'documents')
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const dept = String(formData.get('dept') || '').trim()
    const title = String(formData.get('title') || '').trim()

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    if (!dept) return NextResponse.json({ error: 'Department is required' }, { status: 400 })
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 9)
    const originalExt = path.extname(file.name) || ''
    const safeDept = dept.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${safeDept}/${uniqueId}${originalExt}`

    const uploadDir = path.join(process.cwd(), 'public', 'erp-docs', safeDept)
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, `${uniqueId}${originalExt}`), buffer)

    const created = await db.erpDepartmentDocument.create({
      data: {
        dept,
        title,
        fileName: file.name,
        fileUrl: `/erp-docs/${filename}`,
        fileType: file.type || null,
        uploadedBy: user!.displayName,
      },
    })
    return NextResponse.json({ document: created })
  } catch (e) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
