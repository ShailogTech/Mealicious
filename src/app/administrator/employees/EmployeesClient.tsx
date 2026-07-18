'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import { ErpExportButton } from '@/components/administrator/ErpExportButton'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Employee extends ErpRow {
  id: string
  employeeCode: string
  name: string
  dept: string
  role: string
  city: string
  shift: string
  team: string
  orgLevel: string
  employmentType: string
  status: string
  productivityScore: number
  performanceRating: string
  loginUsername: string
  loginEmail: string
}

const DEPTS = ['Production', 'Sales', 'Marketing', 'Finance', 'HR', 'Quality', 'Warehouse', 'Logistics', 'Procurement', 'R&D', 'Customer Support', 'Administration']
const CITIES = ['Salem', 'Chennai', 'Coimbatore', 'Bengaluru', 'Hyderabad', 'Madurai', 'Erode', 'Trichy', 'Pune', 'Mumbai']
const STATUSES = ['Active', 'On Leave', 'Warned', 'Suspended', 'Terminated']
const EMPLOYMENT_TYPES = ['Full-Time', 'Intern']
const ORG_LEVELS = ['Staff', 'Team Lead', 'Manager']

const COLUMNS: ErpColumn[] = [
  { key: 'employeeCode', label: 'Employee ID' },
  { key: 'name', label: 'Name' },
  { key: 'dept', label: 'Department' },
  { key: 'orgLevel', label: 'Level', type: 'badge' },
  { key: 'employmentType', label: 'Type', type: 'badge' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'productivityScore', label: 'Score', type: 'number' },
  { key: 'loginUsername', label: 'Login' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, section: 'Employment' },
  { key: 'dept', label: 'Department', type: 'select', options: DEPTS, required: true, section: 'Employment' },
  { key: 'role', label: 'Job Title', type: 'text', section: 'Employment' },
  { key: 'city', label: 'City', type: 'select', options: CITIES, section: 'Employment' },
  { key: 'shift', label: 'Shift', type: 'text', section: 'Employment' },
  { key: 'team', label: 'Team', type: 'text', section: 'Employment' },
  { key: 'orgLevel', label: 'Org Level', type: 'select', options: ORG_LEVELS, section: 'Employment' },
  { key: 'employmentType', label: 'Employment Type', type: 'select', options: EMPLOYMENT_TYPES, section: 'Employment' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES, section: 'Employment' },
  { key: 'salary', label: 'Monthly Salary (₹)', type: 'number', section: 'Employment' },
  { key: 'joinedAt', label: 'Joined Date', type: 'date', section: 'Employment' },
  { key: 'internshipStart', label: 'Internship Start (interns only)', type: 'date', section: 'Employment' },
  { key: 'internshipEnd', label: 'Internship End (interns only)', type: 'date', section: 'Employment' },

  { key: 'gender', label: 'Gender', type: 'text', section: 'Personal' },
  { key: 'dob', label: 'Date of Birth', type: 'date', section: 'Personal' },
  { key: 'bloodGroup', label: 'Blood Group', type: 'text', section: 'Personal' },
  { key: 'maritalStatus', label: 'Marital Status', type: 'text', section: 'Personal' },
  { key: 'nationality', label: 'Nationality', type: 'text', section: 'Personal' },
  { key: 'aadhaar', label: 'Aadhaar', type: 'text', section: 'Personal' },
  { key: 'pan', label: 'PAN', type: 'text', section: 'Personal' },
  { key: 'passportNumber', label: 'Passport Number', type: 'text', section: 'Personal' },
  { key: 'drivingLicense', label: 'Driving License', type: 'text', section: 'Personal' },
  { key: 'personalEmail', label: 'Personal Email', type: 'email', section: 'Personal' },
  { key: 'officialEmail', label: 'Official Email', type: 'email', section: 'Personal' },
  { key: 'emergencyContactName', label: 'Emergency Contact Name', type: 'text', section: 'Personal' },
  { key: 'emergencyContactNumber', label: 'Emergency Contact Number', type: 'tel', section: 'Personal' },

  { key: 'permanentAddress', label: 'Permanent Address', type: 'textarea', section: 'Address' },
  { key: 'currentAddress', label: 'Current Address', type: 'textarea', section: 'Address' },
  { key: 'state', label: 'State', type: 'text', section: 'Address' },
  { key: 'pinCode', label: 'PIN Code', type: 'text', section: 'Address' },
  { key: 'country', label: 'Country', type: 'text', section: 'Address' },
  { key: 'workLocation', label: 'Work Location', type: 'text', section: 'Address' },

  { key: 'bankName', label: 'Bank Name', type: 'text', section: 'Bank' },
  { key: 'bankAccountNumber', label: 'Account Number', type: 'text', section: 'Bank' },
  { key: 'bankIFSC', label: 'IFSC', type: 'text', section: 'Bank' },
  { key: 'bankBranch', label: 'Branch', type: 'text', section: 'Bank' },
]

export function EmployeesClient({ employees, canExport }: { employees: Employee[]; canExport?: boolean }) {
  const [rows, setRows] = useState<Employee[]>(employees)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  // Create-Login one-time credentials dialog.
  const [creds, setCreds] = useState<{ email: string; username: string; tempPassword: string } | null>(null)
  const [creatingLoginFor, setCreatingLoginFor] = useState<string | null>(null)

  // Discipline dialog.
  const [disciplineFor, setDisciplineFor] = useState<Employee | null>(null)
  const [disciplineStatus, setDisciplineStatus] = useState('Suspended')
  const [disciplineReason, setDisciplineReason] = useState('')

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Employee); setDrawerOpen(true) }

  async function handleCreateLogin(row: ErpRow) {
    const emp = row as Employee
    if (!confirm(`Create a login account for ${emp.name}? You'll see the temporary password only once.`)) return
    setCreatingLoginFor(emp.id)
    try {
      const res = await fetch(`/api/administrator/employees/${emp.id}/create-login`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed'); return }
      setCreds(data.credentials)
      setRows((r) => r.map((x) => (x.id === emp.id ? { ...x, loginUsername: data.credentials.username, loginEmail: data.credentials.email } : x)))
      toast.success('Login created')
    } finally {
      setCreatingLoginFor(null)
    }
  }

  function openDiscipline(row: ErpRow) {
    setDisciplineFor(row as Employee)
    setDisciplineStatus('Suspended')
    setDisciplineReason('')
  }

  async function submitDiscipline() {
    if (!disciplineFor) return
    const res = await fetch(`/api/administrator/employees/${disciplineFor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: disciplineStatus, suspendedReason: disciplineReason || undefined }),
    })
    if (res.ok) {
      setRows((r) => r.map((x) => (x.id === disciplineFor.id ? { ...x, status: disciplineStatus } : x)))
      toast.success(`${disciplineFor.name} marked ${disciplineStatus}`)
      setDisciplineFor(null)
    } else {
      toast.error('Action failed')
    }
  }

  async function handleDelete(row: ErpRow) {
    const emp = row as Employee
    if (!confirm(`Permanently delete employee record for ${emp.name}? This does not delete the login.`)) return
    const res = await fetch(`/api/administrator/employees/${emp.id}`, { method: 'DELETE' })
    if (res.ok) {
      setRows((r) => r.filter((x) => x.id !== emp.id))
      toast.success('Employee deleted')
    } else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/employees/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { employee } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? {
          ...x, name: employee.name, dept: employee.dept, role: employee.role, city: employee.city ?? '',
          orgLevel: employee.orgLevel ?? '', employmentType: employee.employmentType, status: employee.status,
          shift: employee.shift ?? '', team: employee.team ?? '',
        } : x)))
        toast.success('Employee updated')
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { employee } = await res.json()
        setRows((r) => [{
          id: employee.id, employeeCode: employee.employeeCode, name: employee.name, dept: employee.dept,
          role: employee.role, city: employee.city ?? '', shift: employee.shift ?? '', team: employee.team ?? '',
          orgLevel: employee.orgLevel ?? '', employmentType: employee.employmentType, status: employee.status,
          productivityScore: employee.productivityScore, performanceRating: employee.performanceRating ?? '',
          loginUsername: '', loginEmail: '',
        }, ...r])
        toast.success('Employee added')
      } else { toast.error('Add failed') }
    }
  }

  function rowActions(row: ErpRow) {
    const emp = row as Employee
    if (emp.loginUsername) {
      return <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">has login</span>
    }
    return (
      <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={creatingLoginFor === emp.id}
        onClick={() => handleCreateLogin(emp)} title="Create login">
        {creatingLoginFor === emp.id ? '…' : 'Create Login'}
      </Button>
    )
  }

  return (
    <div>
      <ErpPageHeader
        title="Employees / HRMS"
        description="Manage employee records, logins, and discipline."
        action={<ErpExportButton model="employees" canExport={!!canExport} />}
      />

      <ErpDataTable
        columns={COLUMNS}
        rows={rows}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        renderRowActions={rowActions}
        addLabel="Add Employee"
        emptyMessage="No employees yet. Add your first employee."
      />

      <ErpFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editing ? `Edit ${editing.name}` : 'Add Employee'}
        description={editing ? `Employee ID: ${editing.employeeCode}` : undefined}
        fields={FIELDS}
        initial={editing}
        onSubmit={handleSubmit}
      />

      {/* Discipline action — a second row action, surfaced via a button below for simplicity */}
      <div className="mt-4">
        <p className="text-xs text-stone-500 mb-2">Discipline actions:</p>
        <div className="flex flex-wrap gap-2">
          {rows.filter((e) => e.status === 'Active' || e.status === 'On Leave' || e.status === 'Warned').map((emp) => (
            <Button key={emp.id} variant="outline" size="sm" className="h-7 text-xs"
              onClick={() => openDiscipline(emp)}>
              {emp.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Create-Login credentials dialog (shown once) */}
      <Dialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login created — copy these now</DialogTitle>
            <DialogDescription>These credentials are shown only once. Share them securely.</DialogDescription>
          </DialogHeader>
          {creds && (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs text-stone-500">Email</Label>
                <Input readOnly value={creds.email} onFocus={(e) => e.currentTarget.select()} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-stone-500">Username</Label>
                <Input readOnly value={creds.username} onFocus={(e) => e.currentTarget.select()} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-stone-500">Temporary Password</Label>
                <Input readOnly value={creds.tempPassword} onFocus={(e) => e.currentTarget.select()} className="font-mono" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreds(null)}>I&apos;ve copied them</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discipline dialog */}
      <Dialog open={!!disciplineFor} onOpenChange={(o) => !o && setDisciplineFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discipline — {disciplineFor?.name}</DialogTitle>
            <DialogDescription>Changing status to Suspended or Terminated also deactivates the employee&apos;s login.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>New Status</Label>
              <Select value={disciplineStatus} onValueChange={setDisciplineStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Warned', 'Suspended', 'Terminated'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea value={disciplineReason} onChange={(e) => setDisciplineReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisciplineFor(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitDiscipline}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
