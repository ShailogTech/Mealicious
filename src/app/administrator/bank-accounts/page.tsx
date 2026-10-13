export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { BankAccountsClient } from './BankAccountsClient'

async function getData() {
  const rows = await db.erpBankAccount.findMany({
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  })
  return {
    bankAccounts: rows.map((b) => ({
      id: b.id,
      bankName: b.bankName,
      accountName: b.accountName,
      accountNumber: b.accountNumber,
      ifscCode: b.ifscCode,
      branch: b.branch,
      accountType: b.accountType,
      upiId: b.upiId ?? '',
      isPrimary: b.isPrimary,
      notes: b.notes ?? '',
    })),
  }
}

export default async function BankAccountsPage() {
  const user = await requireErpPageUser()
  if (user.role !== 'SUPER_ADMIN') redirect('/administrator/dashboard')
  const { bankAccounts } = await getData()
  return <BankAccountsClient bankAccounts={bankAccounts} />
}
