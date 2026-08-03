'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Mailbox, UserCheck, UserX, Power } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export interface CompanyEmail {
  id: string
  email: string
  department: string
  assignedTo: string | null
  isActive: boolean
  notes: string | null
}

interface EmployeeOption {
  id: string
  name: string
  dept: string
  officialEmail: string
}

interface EmailManagementClientProps {
  emails: CompanyEmail[]
  employees: EmployeeOption[]
  canManage: boolean
}

const DEPT_TINT: Record<string, string> = {
  Support: 'bg-blue-50 text-blue-700 border-blue-200',
  Sales: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  General: 'bg-amber-50 text-amber-700 border-amber-200',
  Feedback: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function EmailManagementClient({ emails, employees, canManage }: EmailManagementClientProps) {
  const [rows, setRows] = useState<CompanyEmail[]>(emails)
  const [assignFor, setAssignFor] = useState<CompanyEmail | null>(null)
  // selected employee NAME (matches assignedTo on the model)
  const [selectedName, setSelectedName] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)

  function openAssign(email: CompanyEmail) {
    setAssignFor(email)
    setSelectedName(email.assignedTo ?? '')
    setNotes(email.notes ?? '')
  }

  function closeAssign() {
    setAssignFor(null)
    setSelectedName('')
    setNotes('')
  }

  async function submitAssign() {
    if (!assignFor) return
    if (!selectedName) {
      toast.error('Select an employee')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/administrator/email-management/${assignFor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: selectedName, notes: notes || null }),
      })
      if (res.ok) {
        const { email } = await res.json()
        setRows((r) => r.map((x) => (x.id === assignFor.id ? {
          id: email.id, email: email.email, department: email.department,
          assignedTo: email.assignedTo, isActive: email.isActive, notes: email.notes,
        } : x)))
        toast.success(`Assigned ${assignFor.email} to ${selectedName}`)
        closeAssign()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Assign failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function revoke(email: CompanyEmail) {
    if (!confirm(`Revoke access to ${email.email}?`)) return
    const res = await fetch(`/api/administrator/email-management/${email.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTo: null }),
    })
    if (res.ok) {
      const { email: updated } = await res.json()
      setRows((r) => r.map((x) => (x.id === email.id ? {
        id: updated.id, email: updated.email, department: updated.department,
        assignedTo: updated.assignedTo, isActive: updated.isActive, notes: updated.notes,
      } : x)))
      toast.success(`Access revoked for ${email.email}`)
    } else {
      toast.error('Revoke failed')
    }
  }

  async function toggleActive(email: CompanyEmail) {
    const res = await fetch(`/api/administrator/email-management/${email.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !email.isActive }),
    })
    if (res.ok) {
      const { email: updated } = await res.json()
      setRows((r) => r.map((x) => (x.id === email.id ? {
        id: updated.id, email: updated.email, department: updated.department,
        assignedTo: updated.assignedTo, isActive: updated.isActive, notes: updated.notes,
      } : x)))
      toast.success(`${email.email} ${updated.isActive ? 'activated' : 'deactivated'}`)
    } else {
      toast.error('Update failed')
    }
  }

  return (
    <div>
      <ErpPageHeader
        title="Email Management"
        description="Company email accounts and who has access to each inbox."
        action={
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs">
            <Mailbox className="h-3.5 w-3.5" />
            {rows.length} account{rows.length === 1 ? '' : 's'}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((email) => {
          const tint = DEPT_TINT[email.department] || 'bg-stone-50 text-stone-700 border-stone-200'
          return (
            <Card key={email.id} className="overflow-hidden py-0 gap-0 border-stone-200">
              <div className="flex items-center gap-3 border-b border-stone-100 bg-stone-50/60 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Mailbox className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-900" title={email.email}>
                    {email.email}
                  </p>
                  <span className={`inline-flex mt-0.5 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tint}`}>
                    {email.department}
                  </span>
                </div>
                {email.isActive ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[10px]">Active</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                )}
              </div>

              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Assigned To</p>
                  {email.assignedTo ? (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-stone-800">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                      {email.assignedTo}
                    </p>
                  ) : (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-400">
                      <UserX className="h-3.5 w-3.5" />
                      Unassigned
                    </p>
                  )}
                </div>

                {email.notes && (
                  <p className="text-xs text-stone-500 line-clamp-2">{email.notes}</p>
                )}

                {canManage && email.isActive && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openAssign(email)}>
                      {email.assignedTo ? 'Reassign' : 'Assign Access'}
                    </Button>
                    {email.assignedTo && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700" onClick={() => revoke(email)}>
                        Revoke
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-stone-500" onClick={() => toggleActive(email)}>
                      <Power className="h-3 w-3 mr-1" />
                      Deactivate
                    </Button>
                  </div>
                )}
                {canManage && !email.isActive && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleActive(email)}>
                    <Power className="h-3 w-3 mr-1" />
                    Activate
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!canManage && (
        <p className="mt-6 text-center text-xs text-stone-400">
          View-only. Ask a super-admin to assign or revoke access.
        </p>
      )}

      {/* Assign / Reassign dialog (super-admin only) */}
      <Dialog open={!!assignFor} onOpenChange={(o) => !o && closeAssign()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Access — {assignFor?.email}</DialogTitle>
            <DialogDescription>
              Select the ERP employee who will have access to this inbox.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={selectedName} onValueChange={setSelectedName}>
                <SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.name}>
                      {emp.name} — {emp.dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Inbox credentials shared via password manager."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAssign}>Cancel</Button>
            <Button onClick={submitAssign} disabled={saving || !selectedName}>
              {saving ? 'Saving…' : 'Assign Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
