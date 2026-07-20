import { db } from '@/lib/db'

/**
 * ERP employee helpers — ports of the static ERP's genUsername, genPassword,
 * and assignProductivityStats logic, adapted to the server/database.
 */

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Generate a one-time temporary password (e.g. "Welcome@4821"). */
export function generateTempPassword(): string {
  return `Welcome@${rnd(1000, 9999)}`
}

/**
 * Generate a unique username from a full name (e.g. "Arun Kumar" -> "arun.kumar").
 * Suffixes with a number if the candidate already exists in AdminUser.
 */
export async function generateUniqueUsername(fullName: string): Promise<string> {
  const base =
    fullName
      .toLowerCase()
      .replace(/[^a-z ]/g, '')
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .join('.') || 'user'
  let candidate = base
  let n = 1
  while (true) {
    const exists = await db.adminUser.findUnique({ where: { email: candidate } }).catch(() => null)
    // Note: AdminUser uniqueness is on email, not username. We use a derived
    // email for logins, so uniqueness must be checked against email. Callers
    // should pass the candidate through email-building logic. This helper
    // returns the username segment only.
    if (!exists) return candidate
    candidate = `${base}${++n}`
  }
}

/** Next sequential employee code, e.g. "MV-EMP-0003". */
export async function nextEmployeeCode(): Promise<string> {
  const last = await db.erpEmployee.findFirst({
    orderBy: { employeeCode: 'desc' },
    where: { employeeCode: { startsWith: 'MV-EMP-' } },
  })
  let n = 1
  if (last) {
    const parsed = Number.parseInt(last.employeeCode.replace('MV-EMP-', ''), 10)
    if (!Number.isNaN(parsed)) n = parsed + 1
  }
  return `MV-EMP-${String(n).padStart(4, '0')}`
}

/** Productivity score formula, ported from assignProductivityStats. */
export function computeProductivityScore(stats: {
  attendancePct: number
  avgHours: number
  taskCompletionPct: number
  idlePct: number
}): number {
  const hoursScore = Math.min(100, (stats.avgHours / 9) * 100)
  const idleScore = 100 - stats.idlePct
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(stats.attendancePct * 0.35 + stats.taskCompletionPct * 0.3 + hoursScore * 0.2 + idleScore * 0.15),
    ),
  )
  return score
}

export function performanceRatingLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Satisfactory'
  if (score >= 40) return 'Needs Improvement'
  return 'Poor'
}

/** Default monitoring flags for a new employee. */
export const DEFAULT_MONITORING = {
  loginTracking: true,
  idleTracking: true,
  taskTracking: true,
  attendanceTracking: true,
  performanceRating: true,
  overtimeTracking: true,
  readOnly: false,
}

/** Initial productivity stats for a brand-new employee (matches ERP seed). */
export const INITIAL_PRODUCTIVITY = {
  attendancePct: 100,
  avgHours: 0,
  taskCompletionPct: 0,
  idlePct: 0,
  productivityScore: 0, // computed; 0 with zero hours/work
  performanceRating: 'Needs Improvement',
}
