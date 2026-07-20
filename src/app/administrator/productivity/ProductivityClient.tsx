'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity, Award, AlertTriangle } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface DeptScore { dept: string; score: number }
interface Rules {
  minWorkingHours: number
  maxWorkingHours: number
  minProductivityPct: number
  maxBreakMinutes: number
  idleThresholdMinutes: number
  lateLoginAfter: string
  earlyLogoutBefore: string
}

interface Props {
  avgScore: number
  avgAttendance: number
  top10: { id: string; name: string; dept: string; score: number; rating: string }[]
  bottom5: { id: string; name: string; dept: string; score: number; attendance: number }[]
  deptScores: DeptScore[]
  rules: Rules
  canEditRules: boolean
}

const chartConfig = {
  score: { label: 'Avg Score', color: '#1b4332' },
} satisfies ChartConfig

export function ProductivityClient({ avgScore, avgAttendance, top10, bottom5, deptScores, rules: initialRules, canEditRules }: Props) {
  const [rules, setRules] = useState<Rules>(initialRules)
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState<Rules>(initialRules)

  function openEdit() { setDraft(rules); setEditOpen(true) }

  async function saveRules() {
    const res = await fetch('/api/administrator/productivity/rules', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
    })
    if (res.ok) {
      const { productivityRules } = await res.json()
      setRules(productivityRules)
      toast.success('Rules updated')
      setEditOpen(false)
    } else { toast.error('Update failed') }
  }

  const kpis = [
    { label: 'Company Productivity', value: `${avgScore}%`, icon: Activity, accent: 'text-emerald-600' },
    { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: Activity, accent: 'text-blue-600' },
    { label: 'Most Productive', value: top10[0]?.name ?? '—', icon: Award, accent: 'text-amber-600' },
    { label: 'Needs Attention', value: bottom5[0]?.name ?? '—', icon: AlertTriangle, accent: 'text-red-600' },
  ]

  const rulesList = [
    { label: 'Min hours/day', value: `${rules.minWorkingHours}h` },
    { label: 'Max hours/day', value: `${rules.maxWorkingHours}h` },
    { label: 'Min productivity', value: `${rules.minProductivityPct}%` },
    { label: 'Max break', value: `${rules.maxBreakMinutes}m` },
    { label: 'Idle threshold', value: `${rules.idleThresholdMinutes}m` },
    { label: 'Late after', value: rules.lateLoginAfter },
    { label: 'Early exit before', value: rules.earlyLogoutBefore },
  ]

  return (
    <div>
      <ErpPageHeader title="Productivity & Time Tracking" description="Department productivity, leaderboards, and rules." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{kpi.label}</p>
                  <Icon className={`h-4 w-4 ${kpi.accent}`} />
                </div>
                <p className="mt-2 text-lg font-black text-stone-900 truncate">{kpi.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dept productivity chart */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Department Productivity Comparison</CardTitle></CardHeader>
        <CardContent>
          {deptScores.length === 0 ? (
            <p className="text-sm text-stone-500 py-6 text-center">No productivity data yet.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart data={deptScores}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="dept" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} maxBarThickness={32} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top 10 leaderboard */}
        <Card>
          <CardHeader><CardTitle className="text-base">Leaderboard — Top 10</CardTitle></CardHeader>
          <CardContent>
            {top10.length === 0 ? <p className="text-sm text-stone-500 py-4 text-center">No data.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                  <th className="py-2 font-semibold">#</th><th className="font-semibold">Employee</th><th className="font-semibold">Dept</th><th className="font-semibold">Score</th><th className="font-semibold">Rating</th>
                </tr></thead>
                <tbody>
                  {top10.map((e, i) => (
                    <tr key={e.id} className="border-b border-stone-100">
                      <td className="py-1.5 font-mono">{i + 1}</td>
                      <td className="font-medium">{e.name}</td>
                      <td>{e.dept}</td>
                      <td>{e.score}</td>
                      <td><Badge variant="secondary">{e.rating}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Bottom 5 */}
        <Card>
          <CardHeader><CardTitle className="text-base">Needs Attention — Bottom 5</CardTitle></CardHeader>
          <CardContent>
            {bottom5.length === 0 ? <p className="text-sm text-stone-500 py-4 text-center">No data.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                  <th className="py-2 font-semibold">Employee</th><th className="font-semibold">Dept</th><th className="font-semibold">Score</th><th className="font-semibold">Attendance</th>
                </tr></thead>
                <tbody>
                  {bottom5.map((e) => (
                    <tr key={e.id} className="border-b border-stone-100">
                      <td className="font-medium">{e.name}</td>
                      <td>{e.dept}</td>
                      <td>{e.score}</td>
                      <td className="font-mono">{e.attendance}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rules */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Custom Productivity Rules</CardTitle>
          {canEditRules && <Button variant="ghost" size="sm" onClick={openEdit}>Edit</Button>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {rulesList.map((r) => (
              <Badge key={r.label} variant="outline" className="text-xs">
                {r.label}: <b className="ml-1">{r.value}</b>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit rules dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Productivity Rules</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <NumberField label="Min hours/day" value={draft.minWorkingHours} onChange={(v) => setDraft({ ...draft, minWorkingHours: v })} />
            <NumberField label="Max hours/day" value={draft.maxWorkingHours} onChange={(v) => setDraft({ ...draft, maxWorkingHours: v })} />
            <NumberField label="Min productivity %" value={draft.minProductivityPct} onChange={(v) => setDraft({ ...draft, minProductivityPct: v })} />
            <NumberField label="Max break (min)" value={draft.maxBreakMinutes} onChange={(v) => setDraft({ ...draft, maxBreakMinutes: v })} />
            <NumberField label="Idle threshold (min)" value={draft.idleThresholdMinutes} onChange={(v) => setDraft({ ...draft, idleThresholdMinutes: v })} />
            <div className="space-y-1.5"><Label>Late after</Label><Input value={draft.lateLoginAfter} onChange={(e) => setDraft({ ...draft, lateLoginAfter: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Early exit before</Label><Input value={draft.earlyLogoutBefore} onChange={(e) => setDraft({ ...draft, earlyLogoutBefore: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveRules}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  )
}
