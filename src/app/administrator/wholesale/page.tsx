export const dynamic = 'force-dynamic'

import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { WholesaleClient } from './WholesaleClient'

export default async function WholesalePage() {
  await requireErpPageUser()
  return <WholesaleClient />
}
