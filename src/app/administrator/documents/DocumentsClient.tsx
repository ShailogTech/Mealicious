'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Trash2, FileDown, FolderOpen } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Doc {
  id: string
  dept: string
  title: string
  fileName: string
  fileUrl: string
  fileType: string
  uploadedBy: string
  createdAt: string
}

const DEPTS = ['Production', 'Sales', 'Marketing', 'Finance', 'HR', 'Quality', 'Warehouse', 'Logistics', 'Procurement', 'R&D', 'Customer Support', 'Administration']

export function DocumentsClient({ documents }: { documents: Doc[] }) {
  const [rows, setRows] = useState<Doc[]>(documents)
  const [uploadDept, setUploadDept] = useState(DEPTS[0])
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [filterDept, setFilterDept] = useState('all')

  async function handleUpload() {
    if (!uploadFile) { toast.error('Select a file first'); return }
    if (!uploadTitle.trim()) { toast.error('Title is required'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('dept', uploadDept)
      fd.append('title', uploadTitle)
      const res = await fetch('/api/administrator/documents', { method: 'POST', body: fd })
      if (res.ok) {
        const { document } = await res.json()
        setRows((r) => [{
          id: document.id, dept: document.dept, title: document.title,
          fileName: document.fileName, fileUrl: document.fileUrl,
          fileType: document.fileType ?? '', uploadedBy: document.uploadedBy ?? '',
          createdAt: new Date(document.createdAt).toISOString().slice(0, 10),
        }, ...r])
        toast.success('Document uploaded')
        setUploadTitle(''); setUploadFile(null)
        // Reset the file input
        const fi = document.getElementById('doc-file') as HTMLInputElement | null
        if (fi) fi.value = ''
      } else { toast.error('Upload failed') }
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(d: Doc) {
    if (!confirm(`Delete "${d.title}"?`)) return
    const res = await fetch(`/api/administrator/documents/${d.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== d.id)); toast.success('Document deleted') }
    else { toast.error('Delete failed') }
  }

  const filtered = filterDept === 'all' ? rows : rows.filter((d) => d.dept === filterDept)
  const grouped = DEPTS.map((dept) => ({ dept, docs: filtered.filter((d) => d.dept === dept) })).filter((g) => g.docs.length > 0)

  return (
    <div>
      <ErpPageHeader title="Documents" description="Upload and manage documents per department." />

      {/* Upload form */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Upload Document</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={uploadDept} onValueChange={setUploadDept}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g. Q3 Safety Report" />
          </div>
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input id="doc-file" type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button onClick={handleUpload} disabled={uploading}>
            <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="h-4 w-4 text-stone-400" />
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Documents grouped by dept */}
      {grouped.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-stone-500">No documents yet.</CardContent></Card>
      ) : grouped.map((group) => (
        <div key={group.dept} className="mb-6">
          <h3 className="text-sm font-bold text-stone-700 mb-2">{group.dept} <Badge variant="secondary" className="ml-1">{group.docs.length}</Badge></h3>
          <div className="space-y-2">
            {group.docs.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <p className="text-[11px] text-stone-400">{d.fileName} · {d.uploadedBy} · {d.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Download">
                      <a href={d.fileUrl} download={d.fileName} target="_blank" rel="noopener noreferrer"><FileDown className="h-3.5 w-3.5" /></a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(d)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
