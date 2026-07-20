export const dynamic = 'force-dynamic'

import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { BillingClient } from './BillingClient'

export default async function BillingPage() {
  await requireErpPageUser()
  return <BillingClient />
}
