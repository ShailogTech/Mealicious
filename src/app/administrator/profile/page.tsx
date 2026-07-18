export const dynamic = 'force-dynamic'

import { getErpSessionUser } from '@/lib/erp-session'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'

export default async function ProfilePage() {
  const user = await getErpSessionUser()
  if (!user) redirect('/administrator/login')
  return (
    <ProfileClient
      displayName={user.displayName}
      email={user.email}
      role={user.role}
    />
  )
}
