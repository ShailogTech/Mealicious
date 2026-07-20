'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

/**
 * Export-CSV button. Super-admin only (the API enforces this too). Renders
 * nothing for non-super-admin roles so it can be dropped into any module
 * page without conditional logic.
 */
export function ErpExportButton({ model, canExport }: { model: string; canExport: boolean }) {
  const [loading, setLoading] = useState(false)
  if (!canExport) return null

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/administrator/export/${model}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${model}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <Download className="h-4 w-4" /> {loading ? 'Exporting…' : 'Export CSV'}
    </Button>
  )
}
