'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download, FileText, FileSpreadsheet, FileType } from 'lucide-react'

/**
 * Export buttons for ERP modules — CSV, Excel, PDF. Super-admin only.
 * Renders nothing for non-super-admin roles.
 *
 * Usage: <ErpExportButtons model="employees" canExport={!!canExport} />
 */
export function ErpExportButtons({ model, canExport }: { model: string; canExport: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)
  if (!canExport) return null

  async function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    setLoading(format)
    try {
      const res = await fetch(`/api/administrator/export/${model}?format=${format}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${model}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${format.toUpperCase()} exported`)
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={loading !== null} title="Export CSV">
        <Download className="h-3.5 w-3.5" />
        {loading === 'csv' ? '…' : 'CSV'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')} disabled={loading !== null} title="Export Excel">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        {loading === 'xlsx' ? '…' : 'Excel'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={loading !== null} title="Export PDF">
        <FileType className="h-3.5 w-3.5" />
        {loading === 'pdf' ? '…' : 'PDF'}
      </Button>
    </div>
  )
}
