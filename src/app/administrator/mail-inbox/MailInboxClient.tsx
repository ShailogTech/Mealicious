'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Inbox, Star, StarOff, Trash2, Mail, SquarePen, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export interface MailItem {
  id: string
  toEmail: string
  fromEmail: string
  fromName: string
  subject: string
  body: string
  isRead: boolean
  isStarred: boolean
  category: string
  createdAt: string
}

type Folder = 'inbox' | 'starred' | 'unread'

const MAILBOXES = ['support@mealicious.store', 'contact@mealicious.store', 'feedback@mealicious.store']
const CATEGORIES = ['General', 'Support', 'Feedback', 'Sales']

const CATEGORY_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  Support: 'outline',
  Feedback: 'secondary',
  Sales: 'destructive',
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export function MailInboxClient({ mails: initialMails }: { mails: MailItem[] }) {
  const [mails, setMails] = useState<MailItem[]>(initialMails)
  const [folder, setFolder] = useState<Folder>('inbox')
  const [mailbox, setMailbox] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Compose form state
  const [fTo, setFTo] = useState('')
  const [fSubject, setFSubject] = useState('')
  const [fBody, setFBody] = useState('')
  const [fCategory, setFCategory] = useState('General')

  const counts = useMemo(() => ({
    inbox: mails.length,
    starred: mails.filter((m) => m.isStarred).length,
    unread: mails.filter((m) => !m.isRead).length,
  }), [mails])

  const visible = useMemo(() => {
    let list = mails
    if (folder === 'starred') list = list.filter((m) => m.isStarred)
    if (folder === 'unread') list = list.filter((m) => !m.isRead)
    if (mailbox !== 'all') list = list.filter((m) => m.toEmail === mailbox)
    return list
  }, [mails, folder, mailbox])

  function patchLocal(id: string, patch: Partial<MailItem>) {
    setMails((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  async function handleOpen(mail: MailItem) {
    // Toggle expand; mark as read on first open.
    if (expandedId === mail.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(mail.id)
    if (!mail.isRead) {
      patchLocal(mail.id, { isRead: true })
      fetch(`/api/administrator/mail-inbox/${mail.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      }).catch(() => {})
    }
  }

  async function handleStar(mail: MailItem) {
    const next = !mail.isStarred
    patchLocal(mail.id, { isStarred: next })
    const res = await fetch(`/api/administrator/mail-inbox/${mail.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isStarred: next }),
    }).catch(() => null)
    if (!res || !res.ok) {
      patchLocal(mail.id, { isStarred: !next })
      toast.error('Star toggle failed')
    }
  }

  async function handleDelete(mail: MailItem) {
    const res = await fetch(`/api/administrator/mail-inbox/${mail.id}`, { method: 'DELETE' }).catch(() => null)
    if (res && res.ok) {
      setMails((ms) => ms.filter((m) => m.id !== mail.id))
      if (expandedId === mail.id) setExpandedId(null)
      toast.success('Message deleted')
    } else {
      toast.error('Delete failed')
    }
  }

  async function handleSend() {
    if (!fTo.trim()) { toast.error('To address is required'); return }
    if (!fSubject.trim()) { toast.error('Subject is required'); return }
    if (!fBody.trim()) { toast.error('Message body is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/administrator/mail-inbox', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: fTo, subject: fSubject, body: fBody, category: fCategory }),
      })
      if (res.ok) {
        const { mail } = await res.json()
        setMails((ms) => [
          {
            id: mail.id, toEmail: mail.toEmail, fromEmail: mail.fromEmail, fromName: mail.fromName,
            subject: mail.subject, body: mail.body, isRead: mail.isRead, isStarred: mail.isStarred,
            category: mail.category, createdAt: mail.createdAt,
          },
          ...ms,
        ])
        toast.success('Message sent')
        setComposeOpen(false)
        setFTo(''); setFSubject(''); setFBody(''); setFCategory('General')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Send failed')
      }
    } finally {
      setSaving(false)
    }
  }

  const folderItems: { key: Folder; label: string; icon: typeof Inbox; count: number }[] = [
    { key: 'inbox', label: 'Inbox', icon: Inbox, count: counts.inbox },
    { key: 'starred', label: 'Starred', icon: Star, count: counts.starred },
    { key: 'unread', label: 'Unread', icon: Mail, count: counts.unread },
  ]

  return (
    <div>
      <ErpPageHeader
        title="Mail Inbox"
        description="Unified inbox for support@, contact@ and feedback@ — read, star, reply and compose."
        action={
          <Button onClick={() => setComposeOpen(true)}>
            <SquarePen className="h-4 w-4" /> Compose
          </Button>
        }
      />

      <div className="grid md:grid-cols-[220px_1fr] gap-4 items-start">
        {/* Folders sidebar */}
        <div className="rounded-lg border border-stone-200 bg-white p-2 md:sticky md:top-4">
          <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">Folders</p>
          <div className="space-y-1">
            {folderItems.map((f) => (
              <button
                key={f.key}
                onClick={() => setFolder(f.key)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                  folder === f.key
                    ? 'bg-stone-100 text-stone-950'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                )}
              >
                <f.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{f.label}</span>
                <span className="text-xs font-semibold text-stone-400">{f.count}</span>
              </button>
            ))}
          </div>
          <p className="px-2 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">Mailboxes</p>
          <div className="space-y-1">
            <button
              onClick={() => setMailbox('all')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-left truncate transition-colors',
                mailbox === 'all' ? 'bg-stone-100 text-stone-950' : 'text-stone-600 hover:bg-stone-50',
              )}
            >
              All addresses
            </button>
            {MAILBOXES.map((addr) => (
              <button
                key={addr}
                onClick={() => setMailbox(addr)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-left truncate transition-colors',
                  mailbox === addr ? 'bg-stone-100 text-stone-950' : 'text-stone-600 hover:bg-stone-50',
                )}
                title={addr}
              >
                {addr.split('@')[0]}@
              </button>
            ))}
          </div>
        </div>

        {/* Message list */}
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
            <p className="text-sm text-stone-500">
              {visible.length} message{visible.length === 1 ? '' : 's'}
            </p>
          </div>
          {visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">
              No messages in this view. Compose one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {visible.map((m) => {
                const expanded = expandedId === m.id
                return (
                  <li key={m.id} className={cn('group', expanded && 'bg-stone-50')}>
                    <div
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => handleOpen(m)}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStar(m) }}
                        className="mt-0.5 shrink-0"
                        title={m.isStarred ? 'Remove star' : 'Add star'}
                      >
                        {m.isStarred ? (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <StarOff className="h-4 w-4 text-stone-300 group-hover:text-stone-400" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className={cn('text-sm truncate', m.isRead ? 'font-medium text-stone-700' : 'font-bold text-stone-950')}>
                            {m.fromName} <span className="font-normal text-stone-400">&lt;{m.fromEmail}&gt;</span>
                          </p>
                          <span className="text-[11px] text-stone-400 shrink-0">{fmtDate(m.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className={cn('text-sm truncate', m.isRead ? 'text-stone-600' : 'font-semibold text-stone-900')}>
                            {m.subject}
                          </p>
                          {!m.isRead && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Unread" />}
                        </div>
                        {!expanded && (
                          <p className="text-xs text-stone-400 truncate mt-0.5">{m.body}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={CATEGORY_VARIANT[m.category] ?? 'secondary'}>{m.category}</Badge>
                          <span className="text-[11px] text-stone-400">to {m.toEmail}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={(e) => { e.stopPropagation(); handleDelete(m) }} title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={expanded ? 'Collapse' : 'Expand'}>
                          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="px-4 pb-4 pl-11">
                        <div className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-700 whitespace-pre-wrap break-words">
                          {m.body}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Compose</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>To <span className="text-red-500">*</span></Label>
              <Input value={fTo} onChange={(e) => setFTo(e.target.value)} placeholder="e.g. customer@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Input value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="Subject" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={fCategory} onValueChange={setFCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Message <span className="text-red-500">*</span></Label>
              <Textarea
                value={fBody} onChange={(e) => setFBody(e.target.value)}
                placeholder="Write your message…" className="min-h-[140px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSend} disabled={saving}>
              {saving ? 'Sending…' : <><Send className="h-4 w-4" /> Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
