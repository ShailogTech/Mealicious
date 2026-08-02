export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { ProjectsClient } from './ProjectsClient'

async function getData() {
  const projects = await db.erpProject.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    projects: projects.map((p) => ({
      id: p.id, name: p.name, owner: p.owner, dept: p.dept, progress: p.progress, status: p.status,
      dueDate: p.dueDate ? p.dueDate.toISOString().slice(0, 10) : '',
    })),
  }
}

export default async function ProjectsPage() {
  const user = await requireErpPageUser()
  const { projects } = await getData()
  return <ProjectsClient projects={projects} canExport={user.role === 'SUPER_ADMIN'} />
}
