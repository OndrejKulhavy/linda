export interface ClockifyTimeEntry {
  id: string
  description: string
  timeInterval: {
    start: string
    end: string
    duration: string
  }
}

export interface WorkHoursData {
  date: string
  hours: number
}

/**
 * Calculates the UTC offset for Europe/Prague timezone at a given date.
 * Czech Republic uses CET (UTC+1) in winter and CEST (UTC+2) in summer.
 * 
 * DST rules for Europe:
 * - Starts: Last Sunday of March at 02:00 CET (becomes 03:00 CEST)
 * - Ends: Last Sunday of October at 03:00 CEST (becomes 02:00 CET)
 * 
 * @param year - The year
 * @param month - The month (1-12)
 * @param day - The day of month
 * @returns UTC offset in hours (1 for CET, 2 for CEST)
 */
function getCzechTimezoneOffset(year: number, month: number, day: number): number {
  // Find last Sunday of March by starting from last day and working backwards
  let marchLastSunday = new Date(year, 3, 0) // Last day of March
  while (marchLastSunday.getDay() !== 0) { // 0 = Sunday
    marchLastSunday.setDate(marchLastSunday.getDate() - 1)
  }
  
  // Find last Sunday of October by starting from last day and working backwards
  let octoberLastSunday = new Date(year, 10, 0) // Last day of October
  while (octoberLastSunday.getDay() !== 0) { // 0 = Sunday
    octoberLastSunday.setDate(octoberLastSunday.getDate() - 1)
  }
  
  const currentDate = new Date(year, month - 1, day)
  
  // Check if date is in DST period (CEST = UTC+2)
  if (currentDate >= marchLastSunday && currentDate < octoberLastSunday) {
    return 2 // CEST (summer time)
  }
  
  return 1 // CET (winter time)
}

/**
 * Formats a date string for Clockify API with Czech timezone (Europe/Prague).
 * Converts Czech local time to UTC for the API request.
 * 
 * The team is in Czech Republic. When they select "Monday Feb 9", they expect
 * all entries from 00:00:00 to 23:59:59 in Czech local time, not UTC.
 * 
 * @param dateStr - Date in YYYY-MM-DD format
 * @param isEndOfDay - If true, returns end of day (23:59:59 local), otherwise start (00:00:00 local)
 * @returns ISO 8601 timestamp in UTC format (e.g., "2026-02-08T23:00:00.000Z")
 */
export function formatDateForClockify(dateStr: string, isEndOfDay: boolean = false): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  
  // Get timezone offset for this date
  const offset = getCzechTimezoneOffset(year, month, day)
  
  // Calculate UTC time for start/end of day in Czech timezone
  if (isEndOfDay) {
    // End of day: 23:59:59.999 local time
    // For CET (UTC+1): 23:59:59 CET = 22:59:59 UTC
    // For CEST (UTC+2): 23:59:59 CEST = 21:59:59 UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, 23 - offset, 59, 59, 999))
    return utcDate.toISOString()
  } else {
    // Start of day: 00:00:00.000 local time
    // For CET (UTC+1): 00:00:00 CET = 23:00:00 UTC (previous day)
    // For CEST (UTC+2): 00:00:00 CEST = 22:00:00 UTC (previous day)
    const utcDate = new Date(Date.UTC(year, month - 1, day, -offset, 0, 0, 0))
    return utcDate.toISOString()
  }
}

/**
 * Converts a UTC timestamp to Czech local date (YYYY-MM-DD format).
 * Uses Europe/Prague timezone which is CET (UTC+1) or CEST (UTC+2) depending on DST.
 * 
 * @param utcTimestamp - ISO 8601 UTC timestamp (e.g., "2025-01-19T23:30:00Z")
 * @returns Date string in YYYY-MM-DD format in Czech local time
 */
export function utcToCzechDate(utcTimestamp: string): string {
  const date = new Date(utcTimestamp)
  // Format in Czech timezone using 'en-CA' locale for YYYY-MM-DD format
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })
}

export function validateDateRange(from: string | null, to: string | null): { valid: boolean; error?: string } {
  if (!from || !to) {
    return { valid: false, error: "Both 'from' and 'to' parameters are required" }
  }

  const fromDate = new Date(from)
  const toDate = new Date(to)

  if (isNaN(fromDate.getTime())) {
    return { valid: false, error: "Invalid 'from' date format" }
  }

  if (isNaN(toDate.getTime())) {
    return { valid: false, error: "Invalid 'to' date format" }
  }

  if (fromDate > toDate) {
    return { valid: false, error: "'from' date must be before 'to' date" }
  }

  return { valid: true }
}

export async function fetchCurrentUser(apiKey: string): Promise<{ id: string; defaultWorkspace: string }> {
  const response = await fetch("https://api.clockify.me/api/v1/user", {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Clockify API error: ${response.status}`)
  }

  const user = await response.json()
  return { id: user.id, defaultWorkspace: user.defaultWorkspace }
}

export async function fetchClockifyData(
  apiKey: string,
  workspaceId: string,
  userId: string,
  from: string,
  to: string
): Promise<ClockifyTimeEntry[]> {
  const url = `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries?start=${formatDateForClockify(from, false)}&end=${formatDateForClockify(to, true)}`

  const response = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Clockify API error: ${response.status}`)
  }

  return response.json()
}

export function normalizeClockifyData(entries: ClockifyTimeEntry[]): WorkHoursData[] {
  const hoursMap = new Map<string, number>()

  for (const entry of entries) {
    const date = utcToCzechDate(entry.timeInterval.start)
    const duration = entry.timeInterval.duration

    const hours = parseDuration(duration)
    hoursMap.set(date, (hoursMap.get(date) || 0) + hours)
  }

  return Array.from(hoursMap.entries())
    .map(([date, hours]) => ({ date, hours: Math.round(hours * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2] || "0", 10)
  const seconds = parseInt(match[3] || "0", 10)

  return hours + minutes / 60 + seconds / 3600
}
