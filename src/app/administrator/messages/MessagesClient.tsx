'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Send } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Reply { fromName: string; body: string; date: string }
interface Message {
  id: string
  fromName: string
  toName: string
  subject: string
  body: string
  status: string
  replies: Reply[]
  date: string
}
interface Announcement {
  id: string
  title: string
  body: string
  audience: string
  fromName: string
  date: string
}
interface User { id: string; displayName: string }

interface Props {
  inbox: Message[]
  sent: Message[]
  announcements: Announcement[]
  users: User[]
  canBroadcast: boolean
}

type Tab = 'inbox' | 'sent' | 'announcements'

const DEPTS = ['Production', 'Sales', 'Marketing', 'Finance', 'HR', 'Quality', 'Warehouse', 'Logistics', 'Procurement', 'R&D', 'Customer Support', 'Administration']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function MessagesClient({ inbox, sent, announcements, users, canBroadcast }: Props) {
  const [tab, setTab] = useState<Tab>('inbox')
  const [composeOpen, setComposeOpen] = useState(false)
  const [announceOpen, setAnnounceOpen] = useState(false)

  // Compose form.
  const [toUserId, setToUserId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  // Announcement form.
  const [aTitle, setATitle] = useState('')
  const [aBody, setABody] = useState('')
  const [aAudience, setAAudience] = useState('all')

  // Expanded message (for reply).
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [liveInbox, setLiveInbox] = useState<Message[]>(inbox)
  const [liveSent, setLiveSent] = useState<Message[]>(sent)
  const [liveAnnouncements, setLiveAnnouncements] = useState<Announcement[]>(announcements)

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { toast.error('Subject and body required'); return }
    const res = await fetch('/api/administrator/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: toUserId || null, subject, body }),
    })
    if (res.ok) {
      const { message } = await res.json()
      setLiveSent((s) => [{
        id: message.id, fromName: message.fromName, toName: message.toName,
        subject: message.subject, body: message.body, status: 'Read', replies: [], date: message.createdAt,
      }, ...s])
      toast.success('Message sent')
      setComposeOpen(false); setToUserId(''); setSubject(''); setBody('')
    } else { toast.error('Send failed') }
  }

  async function handleAnnounce() {
    if (!aTitle.trim() || !aBody.trim()) { toast.error('Title and body required'); return }
    const res = await fetch('/api/administrator/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: aTitle, body: aBody, audience: aAudience }),
    })
    if (res.ok) {
      const { announcement } = await res.json()
      setLiveAnnouncements((a) => [{
        id: announcement.id, title: announcement.title, body: announcement.body,
        audience: announcement.audience, fromName: announcement.fromName, date: announcement.createdAt,
      }, ...a])
      toast.success('Announcement posted')
      setAnnounceOpen(false); setATitle(''); setABody(''); setAAudience('all')
    } else { toast.error('Post failed') }
  }

  async function handleReply(msgId: string) {
    if (!replyText.trim()) return
    const res = await fetch(`/api/administrator/messages/${msgId}/reply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyText }),
    })
    if (res.ok) {
      const { message } = await res.json()
      const newReply = message.replies[message.replies.length - 1]
      const update = (arr: Message[]) => arr.map((m) => m.id === msgId ? { ...m, replies: [...m.replies, newReply] } : m)
      setLiveInbox(update); setLiveSent(update)
      setReplyText('')
      toast.success('Reply sent')
    } else { toast.error('Reply failed') }
  }

  const list = tab === 'inbox' ? liveInbox : tab === 'sent' ? liveSent : []

  // Render helper as a plain function (not a nested component) to satisfy
  // react-hooks/static-components — returns JSX used inline below.
  const renderTab = (id: Tab, label: string, count: number) => (
    <Button variant={tab === id ? 'default' : 'ghost'} size="sm" onClick={() => setTab(id)}>
      {label} <Badge variant={tab === id ? 'secondary' : 'outline'} className="ml-1.5">{count}</Badge>
    </Button>
  )

  return (
    <div>
      <ErpPageHeader
        title="Messages"
        description="Direct messages, replies, and broadcast announcements."
        action={
          <div className="flex gap-2">
            {canBroadcast && (
              <Button variant="outline" onClick={() => setAnnounceOpen(true)}>
                <Plus className="h-4 w-4" /> Announcement
              </Button>
            )}
            <Button onClick={() => setComposeOpen(true)}><Send className="h-4 w-4" /> Compose</Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-4">
        {renderTab('inbox', 'Inbox', liveInbox.length)}
        {renderTab('sent', 'Sent', liveSent.length)}
        {renderTab('announcements', 'Announcements', liveAnnouncements.length)}
      </div>

      {tab === 'announcements' ? (
        <div className="space-y-3">
          {liveAnnouncements.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-stone-500">No announcements yet.</CardContent></Card>
          ) : liveAnnouncements.map((a) => (
            <Card key={a.id} className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-sm">{a.title}</p>
                  <Badge variant="secondary">{a.audience === 'all' ? 'All Employees' : a.audience}</Badge>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">{a.fromName} · {fmtDate(a.date)}</p>
                <p className="text-sm mt-2 leading-relaxed">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {list.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-stone-500">No messages.</CardContent></Card>
          ) : list.map((m) => {
            const expanded = expandedId === m.id
            return (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{m.subject}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {tab === 'inbox' ? `From ${m.fromName}` : `To ${m.toName}`} · {fmtDate(m.date)}
                      </p>
                    </div>
                    {m.status === 'Unread' && tab === 'inbox' && <Badge variant="destructive">Unread</Badge>}
                    {m.replies.length > 0 && <Badge variant="secondary">{m.replies.length} repl{m.replies.length === 1 ? 'y' : 'ies'}</Badge>}
                  </div>
                  <p className="text-sm mt-2">{m.body}</p>
                  {m.replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-stone-200 pl-3">
                      {m.replies.map((r, i) => (
                        <div key={i} className="text-sm">
                          <p className="text-[11px] text-stone-500">{r.fromName} · {fmtDate(r.date)}</p>
                          <p>{r.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {expanded && (
                    <div className="mt-3 flex gap-2">
                      <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply…" />
                      <Button onClick={() => handleReply(m.id)} disabled={!replyText.trim()}>Reply</Button>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs px-0 mt-2" onClick={() => { setExpandedId(expanded ? null : m.id); setReplyText('') }}>
                    {expanded ? 'Close' : 'Reply'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>To</Label>
              <Select value={toUserId} onValueChange={setToUserId}>
                <SelectTrigger><SelectValue placeholder="HR Team (broadcast)" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-stone-400">Leave empty to broadcast to HR Team.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleSend}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement dialog */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={aAudience} onValueChange={setAAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {DEPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={aTitle} onChange={(e) => setATitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea value={aBody} onChange={(e) => setABody(e.target.value)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnounceOpen(false)}>Cancel</Button>
            <Button onClick={handleAnnounce}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
