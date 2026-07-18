'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Project {
  id: string
  name: string
  owner: string
  dept: string
  progress: number
  status: string
  dueDate: string
}

const COLUMNS = ['Backlog', 'In Progress', 'Review', 'Done'] as const
const DEPTS = ['Production', 'Sales', 'Marketing', 'Finance', 'HR', 'Quality', 'Warehouse', 'Logistics', 'Procurement', 'R&D', 'Customer Support', 'Administration']

const COLUMN_ACCENT: Record<string, string> = {
  Backlog: 'border-t-stone-400',
  'In Progress': 'border-t-blue-500',
  Review: 'border-t-amber-500',
  Done: 'border-t-emerald-500',
}

export function ProjectsClient({ projects }: { projects: Project[] }) {
  const [rows, setRows] = useState<Project[]>(projects)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newOwner, setNewOwner] = useState('')
  const [newDept, setNewDept] = useState('')
  const [newDue, setNewDue] = useState('')

  async function handleCreate() {
    if (!newName.trim()) { toast.error('Project name is required'); return }
    const res = await fetch('/api/administrator/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, owner: newOwner, dept: newDept, dueDate: newDue || null, status: 'Backlog', progress: 0 }),
    })
    if (res.ok) {
      const { project } = await res.json()
      setRows((r) => [{
        id: project.id, name: project.name, owner: project.owner, dept: project.dept,
        progress: project.progress, status: project.status,
        dueDate: project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : '',
      }, ...r])
      toast.success('Project created')
      setCreateOpen(false); setNewName(''); setNewOwner(''); setNewDept(''); setNewDue('')
    } else { toast.error('Create failed') }
  }

  async function moveStatus(p: Project, dir: 1 | -1) {
    const idx = COLUMNS.indexOf(p.status as typeof COLUMNS[number])
    const next = COLUMNS[Math.max(0, Math.min(COLUMNS.length - 1, idx + dir))]
    if (next === p.status) return
    await updateProject(p, { status: next, progress: next === 'Done' ? 100 : p.status === 'Backlog' && next === 'In Progress' ? 15 : p.progress })
  }

  async function updateProject(p: Project, patch: Partial<Project>) {
    const res = await fetch(`/api/administrator/projects/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
    if (res.ok) {
      const { project } = await res.json()
      setRows((r) => r.map((x) => (x.id === p.id ? {
        ...x, status: project.status, progress: project.progress,
      } : x)))
    } else { toast.error('Update failed') }
  }

  async function handleDelete(p: Project) {
    if (!confirm(`Delete project "${p.name}"?`)) return
    const res = await fetch(`/api/administrator/projects/${p.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== p.id)); toast.success('Project deleted') }
    else { toast.error('Delete failed') }
  }

  return (
    <div>
      <ErpPageHeader
        title="Projects"
        description="Kanban board across the project lifecycle."
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Project</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = rows.filter((p) => p.status === col)
          return (
            <div key={col} className={`rounded-lg border border-t-4 ${COLUMN_ACCENT[col]} bg-stone-50 flex flex-col`}>
              <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-700">{col}</h3>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="p-3 space-y-3 flex-1 min-h-[120px]">
                {items.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-6">No projects.</p>
                ) : items.map((p) => (
                  <Card key={p.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">{p.name}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-red-500" onClick={() => handleDelete(p)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {p.owner && <p className="text-[11px] text-stone-500 mt-0.5">{p.owner}{p.dept && ` · ${p.dept}`}</p>}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                          <span>Progress</span><span>{p.progress}%</span>
                        </div>
                        <Progress value={p.progress} className="h-1.5" />
                      </div>
                      {p.dueDate && <p className="text-[10px] text-stone-400 mt-2">Due: {p.dueDate}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={p.status === 'Backlog'} onClick={() => moveStatus(p, -1)} title="Move left">
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-[10px] uppercase tracking-wider text-stone-400">{p.status}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={p.status === 'Done'} onClick={() => moveStatus(p, 1)} title="Move right">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create project dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Project Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Input value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={newDept} onValueChange={setNewDept}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>{DEPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
