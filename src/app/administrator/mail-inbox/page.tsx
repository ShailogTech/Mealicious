export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { MailInboxClient } from './MailInboxClient'

async function getData() {
  const mails = await db.erpMailInbox.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    mails: mails.map((m) => ({
      id: m.id,
      toEmail: m.toEmail,
      fromEmail: m.fromEmail,
      fromName: m.fromName,
      subject: m.subject,
      body: m.body,
      isRead: m.isRead,
      isStarred: m.isStarred,
      category: m.category,
      createdAt: m.createdAt.toISOString(),
    })),
  }
}

export default async function MailInboxPage() {
  await requireErpPageUser()
  const { mails } = await getData()
  return <MailInboxClient mails={mails} />
}
