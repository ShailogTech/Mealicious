/**
 * Department-based accent theming — ported from the ERP's DEPT_THEME map.
 * The logged-in user's department drives the accent color used across the ERP
 * shell (sidebar active state, headers). Super Admin keeps the default brand
 * amber since they oversee every department.
 */
export const DEPT_THEME: Record<string, { accent: string; strong: string }> = {
  Production: { accent: '#2d6b4f', strong: '#1f4d38' },
  Sales: { accent: '#3b7ea1', strong: '#2b6280' },
  Marketing: { accent: '#c1573b', strong: '#a3452c' },
  Finance: { accent: '#1b4332', strong: '#12291f' },
  HR: { accent: '#e8a93b', strong: '#cf8f22' },
  Quality: { accent: '#0ea5b8', strong: '#0b7f8f' },
  Warehouse: { accent: '#a3690f', strong: '#8a570c' },
  Logistics: { accent: '#2d6b4f', strong: '#1f4d38' },
  Procurement: { accent: '#e8a93b', strong: '#cf8f22' },
  'R&D': { accent: '#6d5bd0', strong: '#5747ab' },
  'Customer Support': { accent: '#c1573b', strong: '#a3452c' },
  Administration: { accent: '#d97706', strong: '#b45309' },
}

/** Default brand amber for Super Admin (oversees all departments). */
export const DEFAULT_ACCENT = { accent: '#d97706', strong: '#b45309' }

export function deptAccent(dept: string | null | undefined) {
  if (!dept) return DEFAULT_ACCENT
  return DEPT_THEME[dept] ?? DEFAULT_ACCENT
}
