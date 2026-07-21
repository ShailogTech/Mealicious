export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { DocumentsClient } from './DocumentsClient'

async function getData() {
  const docs = await db.erpDepartmentDocument.findMany({ orderBy: [{ dept: 'asc' }, { createdAt: 'desc' }] })
  return {
    documents: docs.map((d) => ({
      id: d.id,
      dept: d.dept,
      title: d.title,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      fileType: d.fileType ?? '',
      uploadedBy: d.uploadedBy ?? '',
      createdAt: d.createdAt.toISOString().slice(0, 10),
    })),
  }
}

export default async function DocumentsPage() {
  await requireErpPageUser()
  const { documents } = await getData()
  return <DocumentsClient documents={documents} />
}
