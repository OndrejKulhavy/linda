/**
 * Shared utility functions for analytics pages
 */

/**
 * Calculate the week number for a given date
 * @param date The date to calculate week number for
 * @returns Week string in format "W{weekNumber}"
 */
export function getWeekNumber(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `W${weekNo}`
}

/**
 * Get date range for the last N weeks
 * @param weeks Number of weeks to look back (default: 4)
 * @returns Object with 'from' and 'to' date strings in ISO format
 */
export function getLastNWeeksRange(weeks: number = 4): { from: string; to: string } {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (weeks * 7))
  return {
    from: startDate.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  }
}

/**
 * Format a consistency score as a percentage
 * @param avgHours Average hours worked per week
 * @param targetHours Target hours per week (default: 40)
 * @returns Consistency percentage (0-100)
 */
export function calculateConsistency(avgHours: number, targetHours: number = 40): number {
  return Math.max(0, Math.min(100, 100 - (Math.abs(targetHours - avgHours) / targetHours) * 100))
}
