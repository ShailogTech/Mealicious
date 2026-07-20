import { redirect } from 'next/navigation'
import { getErpSessionUser } from '@/lib/erp-session'

/**
 * Server-side guard for ERP pages. Use at the top of each administrator page.
 * Redirects to /administrator/login if no valid session. The shell layout also
 * gates the shell, but this guards the page content itself when the layout
 * renders children bare (unauthenticated state).
 */
export async function requireErpPageUser() {
  const user = await getErpSessionUser()
  if (!user) redirect('/administrator/login')
  return user
}
