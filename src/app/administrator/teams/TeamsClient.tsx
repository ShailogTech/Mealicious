'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Crown } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Member { id: string; name: string; isIntern: boolean }
interface Team {
  id: string
  name: string
  dept: string
  teamLeadId: string
  teamLeadName: string
  managerId: string
  managerName: string
  members: Member[]
}
interface Employee { id: string; name: string; dept: string }

const DEPTS = ['Production', 'Sales', 'Marketing', 'Finance', 'HR', 'Quality', 'Warehouse', 'Logistics', 'Procurement', 'R&D', 'Customer Support', 'Administration']

export function TeamsClient({ teams, employees }: { teams: Team[]; employees: Employee[] }) {
  const [rows, setRows] = useState<Team[]>(teams)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDept, setNewDept] = useState(DEPTS[0])
  const [newLead, setNewLead] = useState('')
  const [newManager, setNewManager] = useState('')

  // Edit lead/manager dialog.
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [editLead, setEditLead] = useState('')
  const [editManager, setEditManager] = useState('')

  async function handleCreate() {
    if (!newName.trim() || !newDept) { toast.error('Name and department are required'); return }
    const res = await fetch('/api/administrator/teams', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, dept: newDept, teamLeadId: newLead || null, managerId: newManager || null }),
    })
    if (res.ok) {
      const { team } = await res.json()
      const lead = employees.find((e) => e.id === newLead)
      const mgr = employees.find((e) => e.id === newManager)
      setRows((r) => [...r, {
        id: team.id, name: team.name, dept: team.dept,
        teamLeadId: newLead, teamLeadName: lead?.name ?? 'Unassigned',
        managerId: newManager, managerName: mgr?.name ?? 'Unassigned', members: [],
      }])
      toast.success('Team created')
      setCreateOpen(false); setNewName(''); setNewLead(''); setNewManager('')
    } else { toast.error('Create failed') }
  }

  function openEdit(t: Team) {
    setEditTeam(t); setEditLead(t.teamLeadId); setEditManager(t.managerId)
  }

  async function saveEdit() {
    if (!editTeam) return
    const res = await fetch(`/api/administrator/teams/${editTeam.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamLeadId: editLead || null, managerId: editManager || null }),
    })
    if (res.ok) {
      const lead = employees.find((e) => e.id === editLead)
      const mgr = employees.find((e) => e.id === editManager)
      setRows((r) => r.map((t) => (t.id === editTeam.id ? {
        ...t, teamLeadId: editLead, teamLeadName: lead?.name ?? 'Unassigned',
        managerId: editManager, managerName: mgr?.name ?? 'Unassigned',
      } : t)))
      toast.success('Team updated')
      setEditTeam(null)
    } else { toast.error('Update failed') }
  }

  async function handleDelete(t: Team) {
    if (!confirm(`Delete team "${t.name}"? Members are not affected.`)) return
    const res = await fetch(`/api/administrator/teams/${t.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== t.id)); toast.success('Team deleted') }
    else { toast.error('Delete failed') }
  }

  return (
    <div>
      <ErpPageHeader
        title="Teams"
        description="Department teams with leads and reporting managers."
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create Team</Button>}
      />
      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-stone-500">No teams yet. Click “Create Team” to set up your first one.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <p className="text-xs text-stone-500 mt-0.5">{t.dept} · Manager: {t.managerName}</p>
                </div>
                <Badge variant="secondary">{t.members.length} members</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-stone-50">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <div className="text-sm">
                    <p className="font-semibold">{t.teamLeadName}</p>
                    <p className="text-[11px] text-stone-500">Team Lead</p>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => openEdit(t)}>Edit</Button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {t.members.length === 0 ? (
                    <p className="text-xs text-stone-400 py-2">No members assigned.</p>
                  ) : t.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1">
                      <span>{m.name}{m.isIntern && <Badge variant="outline" className="ml-2 text-[10px]">Intern</Badge>}</span>
                      {m.name === t.teamLeadName && <Badge variant="secondary" className="text-[10px]">TL</Badge>}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="text-red-600 text-xs mt-2 px-0" onClick={() => handleDelete(t)}>
                  <Trash2 className="h-3 w-3" /> Delete team
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Team Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Production Team A" />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={newDept} onValueChange={setNewDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Team Lead</Label>
              <Select value={newLead} onValueChange={setNewLead}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reporting Manager</Label>
              <Select value={newManager} onValueChange={setNewManager}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit lead/manager dialog */}
      <Dialog open={!!editTeam} onOpenChange={(o) => !o && setEditTeam(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Lead / Manager — {editTeam?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Team Lead</Label>
              <Select value={editLead} onValueChange={setEditLead}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reporting Manager</Label>
              <Select value={editManager} onValueChange={setEditManager}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTeam(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
