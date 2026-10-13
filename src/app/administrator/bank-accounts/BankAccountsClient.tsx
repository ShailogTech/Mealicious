'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Landmark, Star, Copy } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  ifscCode: string
  branch: string
  accountType: string
  upiId: string
  isPrimary: boolean
  notes: string
}

const ACCOUNT_TYPES = ['Current', 'Savings', 'Fixed Deposit']

function maskAccountNumber(num: string): string {
  const digits = num.replace(/\s+/g, '')
  if (digits.length <= 4) return digits
  return '****' + digits.slice(-4)
}

export function BankAccountsClient({ bankAccounts }: { bankAccounts: BankAccount[] }) {
  const [rows, setRows] = useState<BankAccount[]>(bankAccounts)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add-account form state
  const [fBankName, setFBankName] = useState('')
  const [fAccountName, setFAccountName] = useState('')
  const [fAccountNumber, setFAccountNumber] = useState('')
  const [fIfscCode, setFIfscCode] = useState('')
  const [fBranch, setFBranch] = useState('')
  const [fAccountType, setFAccountType] = useState('Current')
  const [fUpiId, setFUpiId] = useState('')
  const [fIsPrimary, setFIsPrimary] = useState(false)
  const [fNotes, setFNotes] = useState('')

  function resetForm() {
    setFBankName(''); setFAccountName(''); setFAccountNumber(''); setFIfscCode('')
    setFBranch(''); setFAccountType('Current'); setFUpiId(''); setFIsPrimary(false); setFNotes('')
  }

  async function handleAdd() {
    if (!fBankName.trim()) { toast.error('Bank name is required'); return }
    if (!fAccountName.trim()) { toast.error('Account name is required'); return }
    if (!fAccountNumber.trim()) { toast.error('Account number is required'); return }
    if (!fIfscCode.trim()) { toast.error('IFSC code is required'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/administrator/bank-accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: fBankName, accountName: fAccountName, accountNumber: fAccountNumber,
          ifscCode: fIfscCode, branch: fBranch, accountType: fAccountType,
          upiId: fUpiId, isPrimary: fIsPrimary, notes: fNotes,
        }),
      })
      if (res.ok) {
        const { bankAccount } = await res.json()
        const mapped: BankAccount = {
          id: bankAccount.id,
          bankName: bankAccount.bankName,
          accountName: bankAccount.accountName,
          accountNumber: bankAccount.accountNumber,
          ifscCode: bankAccount.ifscCode,
          branch: bankAccount.branch,
          accountType: bankAccount.accountType,
          upiId: bankAccount.upiId ?? '',
          isPrimary: bankAccount.isPrimary,
          notes: bankAccount.notes ?? '',
        }
        // If this new one is primary, demote the others client-side (matches API).
        setRows((r) => {
          const updated = fIsPrimary ? r.map((x) => ({ ...x, isPrimary: false })) : r
          return [mapped, ...updated]
        })
        toast.success('Bank account added')
        setAddOpen(false)
        resetForm()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Add failed')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleSetPrimary(b: BankAccount, primary: boolean) {
    const res = await fetch(`/api/administrator/bank-accounts/${b.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrimary: primary }),
    })
    if (res.ok) {
      setRows((r) => {
        if (primary) return r.map((x) => (x.id === b.id ? { ...x, isPrimary: true } : { ...x, isPrimary: false }))
        return r.map((x) => (x.id === b.id ? { ...x, isPrimary: false } : x))
      })
      toast.success(primary ? 'Set as primary' : 'Primary removed')
    } else { toast.error('Update failed') }
  }

  async function handleDelete(b: BankAccount) {
    if (!confirm(`Delete bank account at ${b.bankName}? This cannot be undone.`)) return
    const res = await fetch(`/api/administrator/bank-accounts/${b.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== b.id)); toast.success('Bank account deleted') }
    else { toast.error('Delete failed') }
  }

  async function copyUpi(upi: string) {
    try {
      await navigator.clipboard.writeText(upi)
      toast.success('UPI ID copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <div>
      <ErpPageHeader
        title="Bank Accounts"
        description="Company bank accounts and UPI details. Super Admin only."
        action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Account</Button>}
      />

      {rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-stone-500">No bank accounts yet. Click “Add Account” to add one.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((b) => (
            <Card key={b.id} className={b.isPrimary ? 'ring-2 ring-amber-400' : undefined}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 shrink-0">
                    <Landmark className="h-4 w-4 text-stone-600" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{b.bankName}</CardTitle>
                    <p className="text-xs text-stone-500 mt-0.5 truncate">{b.accountName}</p>
                  </div>
                </div>
                {b.isPrimary && <Badge className="border-transparent bg-amber-100 text-amber-800"><Star className="h-3 w-3" /> Primary</Badge>}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">A/C</span>
                  <span className="font-mono font-medium">{maskAccountNumber(b.accountNumber)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">IFSC</span>
                  <span className="font-mono">{b.ifscCode}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">Branch</span>
                  <span className="text-right">{b.branch || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">Type</span>
                  <Badge variant="secondary">{b.accountType}</Badge>
                </div>
                {b.upiId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">UPI</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{b.upiId}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyUpi(b.upiId)} title="Copy UPI ID">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {b.notes && <p className="text-xs text-stone-400 pt-1 border-t border-stone-100">{b.notes}</p>}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={b.isPrimary} onCheckedChange={(checked) => handleSetPrimary(b, checked)} />
                    <span className="text-xs text-stone-500">Set Primary</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600 text-xs px-2" onClick={() => handleDelete(b)}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Account dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Bank Name <span className="text-red-500">*</span></Label>
              <Input value={fBankName} onChange={(e) => setFBankName(e.target.value)} placeholder="e.g. HDFC Bank" />
            </div>
            <div className="space-y-1.5">
              <Label>Account Name <span className="text-red-500">*</span></Label>
              <Input value={fAccountName} onChange={(e) => setFAccountName(e.target.value)} placeholder="Name as per bank records" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Account Number <span className="text-red-500">*</span></Label>
                <Input value={fAccountNumber} onChange={(e) => setFAccountNumber(e.target.value)} placeholder="Account number" />
              </div>
              <div className="space-y-1.5">
                <Label>IFSC Code <span className="text-red-500">*</span></Label>
                <Input value={fIfscCode} onChange={(e) => setFIfscCode(e.target.value)} placeholder="e.g. HDFC0001234" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Input value={fBranch} onChange={(e) => setFBranch(e.target.value)} placeholder="Branch" />
              </div>
              <div className="space-y-1.5">
                <Label>Account Type</Label>
                <Select value={fAccountType} onValueChange={setFAccountType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>UPI ID</Label>
              <Input value={fUpiId} onChange={(e) => setFUpiId(e.target.value)} placeholder="e.g. mealicious@hdfcbank" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch checked={fIsPrimary} onCheckedChange={setFIsPrimary} />
              Set as primary account
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); resetForm() }} disabled={saving}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving…' : <><Plus className="h-4 w-4" /> Add</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
