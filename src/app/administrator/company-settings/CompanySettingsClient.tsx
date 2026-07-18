'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'

const FIELDS: { key: string; label: string; type?: 'text' | 'textarea' }[][] = [
  [
    { key: 'companyName', label: 'Company Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
  ],
  [
    { key: 'gstin', label: 'GSTIN' },
    { key: 'fssai', label: 'FSSAI' },
    { key: 'cin', label: 'CIN' },
    { key: 'invoicePrefix', label: 'Invoice Prefix' },
  ],
  [
    { key: 'bankName', label: 'Bank Name' },
    { key: 'bankAccountName', label: 'Account Name' },
    { key: 'bankAccountNumber', label: 'Account Number' },
    { key: 'bankIFSC', label: 'IFSC' },
    { key: 'bankBranch', label: 'Branch' },
    { key: 'upiId', label: 'UPI ID' },
  ],
]

const SECTION_TITLES = ['Company', 'Legal / Tax', 'Bank Details']

export function CompanySettingsClient({ company }: { company: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const section of FIELDS) for (const f of section) init[f.key] = company[f.key] ?? ''
    init.address = company.address ?? ''
    init.terms = company.terms ?? ''
    init.footerText = company.footerText ?? ''
    return init
  })
  const [saving, setSaving] = useState(false)

  function set(key: string, val: string) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/administrator/company-settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) toast.success('Company settings saved')
      else toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <ErpPageHeader
        title="Company Settings"
        description="Legal identity and bank details — used on invoices and the letterhead."
        action={<Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>}
      />

      <div className="space-y-6">
        {FIELDS.map((section, si) => (
          <Card key={si}>
            <CardHeader><CardTitle className="text-base">{SECTION_TITLES[si]}</CardTitle></CardHeader>
            <CardContent>
              {si === 0 && (
                <div className="space-y-1.5 mb-4">
                  <Label>Address</Label>
                  <Textarea value={values.address ?? ''} onChange={(e) => set('address', e.target.value)} rows={2} />
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {section.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label>{f.label}</Label>
                    <Input value={values[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Text</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Terms & Conditions</Label>
              <Textarea value={values.terms ?? ''} onChange={(e) => set('terms', e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Footer Text</Label>
              <Textarea value={values.footerText ?? ''} onChange={(e) => set('footerText', e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  )
}
