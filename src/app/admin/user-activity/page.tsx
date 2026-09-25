export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { UserActivityClient } from './UserActivityClient'
import { format } from 'date-fns'

export default async function UserActivityPage() {
  const RECENT_LIMIT = 200

  const [activities, users, totalViews, totalCartAdds, topProducts, topUsers] = await Promise.all([
    db.userActivity.findMany({ orderBy: { createdAt: 'desc' }, take: RECENT_LIMIT }),
    db.user.findMany({ select: { id: true, name: true, email: true } }),
    db.userActivity.count({ where: { activityType: 'view_product' } }),
    db.userActivity.count({ where: { activityType: 'add_to_cart' } }),
    db.userActivity.groupBy({
      by: ['productName'],
      where: { activityType: 'view_product', productName: { not: null } },
      _count: { productName: true },
      orderBy: { _count: { productName: 'desc' } },
      take: 1,
    }),
    db.userActivity.groupBy({
      by: ['userId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 1,
    }),
  ])

  // userId is opaque: the DB id or the email when logged in, 'anonymous' otherwise.
  const usersByIdOrEmail = new Map<string, { name: string; email: string }>()
  for (const u of users) {
    usersByIdOrEmail.set(u.id, { name: u.name, email: u.email })
    usersByIdOrEmail.set(u.email.toLowerCase(), { name: u.name, email: u.email })
  }

  const topProduct = topProducts[0]?.productName
    ? { name: topProducts[0].productName, count: topProducts[0]._count.productName }
    : null

  const rawTopUserId = topUsers[0]?.userId
  const topUser = rawTopUserId
    ? {
        label:
          rawTopUserId === 'anonymous'
            ? 'Anonymous'
            : usersByIdOrEmail.get(rawTopUserId.toLowerCase())?.name || rawTopUserId,
        count: topUsers[0]._count.userId,
      }
    : null

  return (
    <div>
      <AdminHeader title="User Activity" />
      <UserActivityClient
        activities={activities.map((a) => {
          const user =
            a.userId === 'anonymous'
              ? { name: 'Anonymous', email: '' }
              : usersByIdOrEmail.get(a.userId.toLowerCase()) || { name: a.userId, email: '' }
          return {
            id: a.id,
            userId: a.userId,
            userName: user.name,
            userEmail: user.email,
            activityType: a.activityType,
            productName: a.productName ?? '',
            date: format(new Date(a.createdAt), 'dd MMM yyyy, HH:mm'),
          }
        })}
        stats={{
          totalViews,
          totalCartAdds,
          topProduct,
          topUser,
        }}
      />
    </div>
  )
}
