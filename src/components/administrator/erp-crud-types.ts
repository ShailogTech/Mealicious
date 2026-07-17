/**
 * Config-driven CRUD types for ERP modules — the React port of the static
 * ERP's renderCrudModule(), driven by a MODULES-like config object.
 *
 * Each module defines:
 *  - columns: how a row renders in the table (key, label, optional cell type)
 *  - fields:  how a row is created/edited in the form drawer (key, label, input type, options)
 */

export type ColumnType = 'text' | 'inr' | 'badge' | 'number'

export interface ErpColumn {
  key: string
  label: string
  type?: ColumnType
}

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'tel'

export interface ErpField {
  key: string
  label: string
  type: FieldType
  options?: string[]
  /** When true, required on create. */
  required?: boolean
  /** Fieldset grouping for long forms (e.g. "Personal", "Bank"). */
  section?: string
  /** Help text under the field. */
  help?: string
}

export type ErpRow = Record<string, unknown>

export function inr(n: number): string {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}
