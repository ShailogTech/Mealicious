'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, UserPlus, X } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Member { id: string; name: string; dept: string }
interface Group {
  id: string
  name: string
  description: string
  ownerName: string
  members: Member[]
}
interface Employee { id: string; name: string; dept: string }

export function GroupsClient({ groups, employees }: { groups: Group[]; employees: Employee[] }) {
  const [rows, setRows] = useState<Group[]>(groups)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newOwner, setNewOwner] = useState('')
  const [newMembers, setNewMembers] = useState<string[]>([])

  // Edit members dialog.
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [editMembers, setEditMembers] = useState<string[]>([])
  const [addMemberId, setAddMemberId] = useState('')

  function resetCreate() { setNewName(''); setNewDesc(''); setNewOwner(''); setNewMembers([]) }

  async function handleCreate() {
    if (!newName.trim()) { toast.error('Name is required'); return }
    const res = await fetch('/api/administrator/groups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, description: newDesc, ownerName: newOwner, memberIds: newMembers }),
    })
    if (res.ok) {
      const { group } = await res.json()
      const members = newMembers
        .map((id) => employees.find((e) => e.id === id))
        .filter(Boolean)
        .map((e) => ({ id: (e as Employee).id, name: (e as Employee).name, dept: (e as Employee).dept }))
      setRows((r) => [{
        id: group.id, name: group.name, description: group.description ?? '',
        ownerName: group.ownerName ?? '', members,
      }, ...r])
      toast.success('Group created')
      setCreateOpen(false); resetCreate()
    } else { toast.error('Create failed') }
  }

  function openEdit(g: Group) {
    setEditGroup(g); setEditMembers(g.members.map((m) => m.id)); setAddMemberId('')
  }

  async function saveEdit() {
    if (!editGroup) return
    const res = await fetch(`/api/administrator/groups/${editGroup.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds: editMembers }),
    })
    if (res.ok) {
      const members = editMembers
        .map((id) => employees.find((e) => e.id === id))
        .filter(Boolean)
        .map((e) => ({ id: (e as Employee).id, name: (e as Employee).name, dept: (e as Employee).dept }))
      setRows((r) => r.map((g) => (g.id === editGroup.id ? { ...g, members } : g)))
      toast.success('Members updated')
      setEditGroup(null)
    } else { toast.error('Update failed') }
  }

  async function handleDelete(g: Group) {
    if (!confirm(`Delete group "${g.name}"?`)) return
    const res = await fetch(`/api/administrator/groups/${g.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== g.id)); toast.success('Group deleted') }
    else { toast.error('Delete failed') }
  }

  return (
    <div>
      <ErpPageHeader
        title="Groups"
        description="Cross-department groups with member rosters."
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create Group</Button>}
      />
      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-stone-500">No groups yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((g) => (
            <Card key={g.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  {g.ownerName && <p className="text-xs text-stone-500 mt-0.5">Owner: {g.ownerName}</p>}
                </div>
                <Badge variant="secondary">{g.members.length}</Badge>
              </CardHeader>
              <CardContent>
                {g.description && <p className="text-sm text-stone-600 mb-2">{g.description}</p>}
                <div className="space-y-1 max-h-40 overflow-y-auto mb-2">
                  {g.members.length === 0 ? (
                    <p className="text-xs text-stone-400 py-2">No members.</p>
                  ) : g.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1">
                      <span>{m.name}</span>
                      <span className="text-[11px] text-stone-400">{m.dept}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs px-0" onClick={() => openEdit(g)}>
                    <UserPlus className="h-3 w-3" /> Manage members
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 text-xs" onClick={() => handleDelete(g)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Group</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Group Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Input value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage members dialog */}
      <Dialog open={!!editGroup} onOpenChange={(o) => !o && setEditGroup(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Members — {editGroup?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {editMembers.length === 0 ? (
                <p className="text-xs text-stone-400 py-2">No members yet.</p>
              ) : editMembers.map((id) => {
                const emp = employees.find((e) => e.id === id)
                return (
                  <div key={id} className="flex items-center justify-between text-sm py-1">
                    <span>{emp?.name ?? 'Unknown'}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600"
                      onClick={() => setEditMembers((m) => m.filter((x) => x !== id))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Select value={addMemberId} onValueChange={setAddMemberId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Add member…" /></SelectTrigger>
                <SelectContent>
                  {employees.filter((e) => !editMembers.includes(e.id)).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} · {e.dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" disabled={!addMemberId} onClick={() => {
                if (addMemberId && !editMembers.includes(addMemberId)) setEditMembers((m) => [...m, addMemberId])
                setAddMemberId('')
              }}>Add</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroup(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
