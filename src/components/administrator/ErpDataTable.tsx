'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Plus } from 'lucide-react'
import type { ErpColumn, ErpRow } from './erp-crud-types'
import { inr } from './erp-crud-types'

interface ErpDataTableProps {
  columns: ErpColumn[]
  rows: ErpRow[]
  onAdd?: () => void
  onEdit?: (row: ErpRow) => void
  onDelete?: (row: ErpRow) => void
  /** Extra per-row action buttons (rendered by parent). */
  renderRowActions?: (row: ErpRow) => React.ReactNode
  /** Per-column custom cell renderer (overrides the default cell). */
  renderCell?: (column: ErpColumn, row: ErpRow) => React.ReactNode
  addLabel?: string
  emptyMessage?: string
}

function Cell({ column, row }: { column: ErpColumn; row: ErpRow }) {
  const raw = row[column.key]
  const type = column.type ?? 'text'
  if (type === 'inr') return <span className="font-semibold">{inr(Number(raw ?? 0))}</span>
  if (type === 'number') return <span>{String(raw ?? '')}</span>
  if (type === 'badge') {
    const value = String(raw ?? '')
    if (!value) return <span className="text-stone-400">—</span>
    return <Badge variant="secondary">{value}</Badge>
  }
  return <span>{String(raw ?? '')}</span>
}

export function ErpDataTable({
  columns, rows, onAdd, onEdit, onDelete, renderRowActions, renderCell, addLabel = 'Add', emptyMessage = 'No records yet.',
}: ErpDataTableProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <p className="text-sm text-stone-500">{rows.length} record{rows.length === 1 ? '' : 's'}</p>
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" /> {addLabel}
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
              {(onEdit || onDelete || renderRowActions) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-sm text-stone-500 py-10">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={(row.id as string) || idx}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className="text-sm">
                      {renderCell ? (renderCell(c, row) ?? <Cell column={c} row={row} />) : <Cell column={c} row={row} />}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || renderRowActions) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {renderRowActions?.(row)}
                        {onEdit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(row)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => onDelete(row)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
