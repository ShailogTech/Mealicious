'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Comment { fromName: string; body: string; date: string }
interface Ticket {
  id: string
  subject: string
  body: string
  category: string
  priority: string
  status: string
  fromName: string
  fromDept: string
  assignedDept: string
  comments: Comment[]
  date: string
}

const PRIORITIES = ['Low', 'Normal', 'High', 'Critical']
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']
const CATEGORIES = ['General', 'IT Support', 'HR Query', 'Finance', 'Operations', 'Facilities']

const PRIORITY_VARIANT: Record<string, 'secondary' | 'destructive' | 'outline'> = {
  Low: 'outline', Normal: 'secondary', High: 'secondary', Critical: 'destructive',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function TicketsClient({ mine, others }: { mine: Ticket[]; others: Ticket[] }) {
  const [tab, setTab] = useState<'mine' | 'queue'>('mine')
  const [createOpen, setCreateOpen] = useState(false)
  const [liveMine, setLiveMine] = useState<Ticket[]>(mine)
  const [liveOthers, setLiveOthers] = useState<Ticket[]>(others)

  // Create form.
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState('Normal')

  // Per-ticket comment input.
  const [commentFor, setCommentFor] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  async function handleCreate() {
    if (!subject.trim() || !body.trim()) { toast.error('Subject and body required'); return }
    const res = await fetch('/api/administrator/mail-tickets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, category, priority }),
    })
    if (res.ok) {
      const { ticket } = await res.json()
      setLiveMine((m) => [{
        id: ticket.id, subject: ticket.subject, body: ticket.body, category: ticket.category,
        priority: ticket.priority, status: ticket.status, fromName: ticket.fromName,
        fromDept: ticket.fromDept ?? '', assignedDept: ticket.assignedDept ?? '',
        comments: [], date: ticket.createdAt,
      }, ...m])
      toast.success('Ticket created')
      setCreateOpen(false); setSubject(''); setBody(''); setCategory('General'); setPriority('Normal')
    } else { toast.error('Create failed') }
  }

  async function updateTicket(t: Ticket, patch: { status?: string; priority?: string }) {
    const res = await fetch(`/api/administrator/mail-tickets/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
    if (res.ok) {
      const { ticket } = await res.json()
      const merged = { ...t, status: ticket.status, priority: ticket.priority, comments: ticket.comments }
      setLiveMine((arr) => arr.map((x) => (x.id === t.id ? merged : x)))
      setLiveOthers((arr) => arr.map((x) => (x.id === t.id ? merged : x)))
      toast.success('Ticket updated')
    } else { toast.error('Update failed') }
  }

  async function addComment(t: Ticket) {
    if (!commentText.trim()) return
    const res = await fetch(`/api/administrator/mail-tickets/${t.id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: commentText }),
    })
    if (res.ok) {
      const { ticket } = await res.json()
      const newComment = ticket.comments[ticket.comments.length - 1]
      const merged = { ...t, comments: [...t.comments, newComment] }
      setLiveMine((arr) => arr.map((x) => (x.id === t.id ? merged : x)))
      setLiveOthers((arr) => arr.map((x) => (x.id === t.id ? merged : x)))
      setCommentText('')
      toast.success('Comment added')
    } else { toast.error('Comment failed') }
  }

  const list = tab === 'mine' ? liveMine : liveOthers

  return (
    <div>
      <ErpPageHeader
        title="Mail / Tickets"
        description="Internal helpdesk — raise issues and track resolutions."
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Ticket</Button>}
      />

      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'mine' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('mine')}>
          My Tickets <Badge variant={tab === 'mine' ? 'secondary' : 'outline'} className="ml-1.5">{liveMine.length}</Badge>
        </Button>
        <Button variant={tab === 'queue' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('queue')}>
          Department Queue <Badge variant={tab === 'queue' ? 'secondary' : 'outline'} className="ml-1.5">{liveOthers.length}</Badge>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-stone-500">No tickets here.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {list.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.subject}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {tab === 'queue' ? `From ${t.fromName}${t.fromDept ? ` · ${t.fromDept}` : ''}` : `Opened by you`} · {fmtDate(t.date)}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant={PRIORITY_VARIANT[t.priority] ?? 'secondary'}>{t.priority}</Badge>
                    <Badge variant="outline">{t.status}</Badge>
                  </div>
                </div>
                <p className="text-sm mt-2">{t.body}</p>

                {t.comments.length > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 border-stone-200 pl-3">
                    {t.comments.map((c, i) => (
                      <div key={i} className="text-sm">
                        <p className="text-[11px] text-stone-500">{c.fromName} · {fmtDate(c.date)}</p>
                        <p>{c.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status / priority controls + comment */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Select value={t.status} onValueChange={(v) => updateTicket(t, { status: v })}>
                    <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={t.priority} onValueChange={(v) => updateTicket(t, { priority: v })}>
                    <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="text-xs px-0" onClick={() => { setCommentFor(commentFor === t.id ? null : t.id); setCommentText('') }}>
                    {commentFor === t.id ? 'Close' : 'Comment'}
                  </Button>
                </div>
                {commentFor === t.id && (
                  <div className="mt-2 flex gap-2">
                    <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment…" />
                    <Button size="sm" onClick={() => addComment(t)} disabled={!commentText.trim()}>Add</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create ticket dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Details</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
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
