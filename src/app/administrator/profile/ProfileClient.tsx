'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'

interface Props {
  displayName: string
  email: string
  role: string
}

export function ProfileClient({ displayName, email, role }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/administrator/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to change password')
        return
      }
      toast.success('Password changed')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <ErpPageHeader title="My Profile" description="Account details and password management." />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-stone-500">Name</Label>
              <p className="text-sm font-medium">{displayName}</p>
            </div>
            <div>
              <Label className="text-xs text-stone-500">Email</Label>
              <p className="text-sm font-medium">{email}</p>
            </div>
            <div>
              <Label className="text-xs text-stone-500">Role</Label>
              <div className="mt-1"><Badge variant="secondary">{role.replace('_', ' ')}</Badge></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
                <p className="text-[11px] text-stone-400">Minimum 8 characters.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input id="confirm" type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
