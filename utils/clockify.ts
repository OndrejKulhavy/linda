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
  const url = `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${userId}/time-entries?start=${from}T00:00:00Z&end=${to}T23:59:59Z`

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
    const date = entry.timeInterval.start.split("T")[0]
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
