'use client'

import { useState } from 'react'
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ErpField, ErpRow } from './erp-crud-types'

interface ErpFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: ErpField[]
  /** Initial values when editing; undefined when creating. */
  initial?: ErpRow | null
  onSubmit: (values: ErpRow) => Promise<void>
  submitLabel?: string
}

function toInputValue(type: ErpField['type'], value: unknown): string {
  if (value == null) return ''
  if (type === 'date' && value instanceof Date) return value.toISOString().slice(0, 10)
  if (type === 'date' && typeof value === 'string') return value.slice(0, 10)
  return String(value)
}

export function ErpFormDrawer({
  open, onOpenChange, title, description, fields, initial, onSubmit, submitLabel = 'Save',
}: ErpFormDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  // Track the previous `open` so we reset the form on each open transition
  // (false → true) without calling setState inside an effect.
  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    const seed: Record<string, string> = {}
    for (const f of fields) seed[f.key] = toInputValue(f.type, initial?.[f.key])
    setValues(seed)
    setWasOpen(true)
  } else if (!open && wasOpen) {
    setWasOpen(false)
  }

  // Group fields by section (top-level fields get no heading).
  const sections: { name?: string; fields: ErpField[] }[] = []
  for (const f of fields) {
    const last = sections[sections.length - 1]
    if (last && last.name === f.section) last.fields.push(f)
    else sections.push({ name: f.section, fields: [f] })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // Coerce numeric fields; leave the rest as strings — the API does final shaping.
      const out: ErpRow = {}
      for (const f of fields) {
        const v = values[f.key] ?? ''
        if (f.type === 'number') out[f.key] = v === '' ? 0 : Number(v)
        else out[f.key] = v
      }
      await onSubmit(out)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 px-4">
          {sections.map((section, si) => (
            <div key={si} className="space-y-4">
              {section.name && (
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-1">
                  {section.name}
                </p>
              )}
              {section.fields.map((f) => {
                const value = values[f.key] ?? ''
                if (f.type === 'select' && f.options) {
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label htmlFor={f.key}>{f.label}{f.required && <span className="text-red-500"> *</span>}</Label>
                      <Select value={value} onValueChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}>
                        <SelectTrigger id={f.key}><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                          {f.options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {f.help && <p className="text-xs text-stone-400">{f.help}</p>}
                    </div>
                  )
                }
                if (f.type === 'textarea') {
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label htmlFor={f.key}>{f.label}{f.required && <span className="text-red-500"> *</span>}</Label>
                      <Textarea id={f.key} value={value} onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))} />
                    </div>
                  )
                }
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={f.key}>{f.label}{f.required && <span className="text-red-500"> *</span>}</Label>
                    <Input
                      id={f.key}
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                      value={value}
                      onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                      required={f.required}
                    />
                    {f.help && <p className="text-xs text-stone-400">{f.help}</p>}
                  </div>
                )
              })}
            </div>
          ))}
          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : submitLabel}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
