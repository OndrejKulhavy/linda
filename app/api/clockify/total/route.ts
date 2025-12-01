import { NextRequest, NextResponse } from "next/server"
import { validateDateRange, fetchCurrentUser } from "@/utils/clockify"

interface ClockifyTimeEntry {
  id: string
  timeInterval: {
    start: string
    end: string | null
    duration: string | null
  }
}

function parseDuration(duration: string | null): number {
  if (!duration) return 0
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2] || "0", 10)
  const seconds = parseInt(match[3] || "0", 10)
  return hours + minutes / 60 + seconds / 3600
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const validation = validateDateRange(from, to)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const apiKey = process.env.CLOCKIFY_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "CLOCKIFY_API_KEY is not configured" }, { status: 500 })
  }

  try {
    const { defaultWorkspace: workspaceId } = await fetchCurrentUser(apiKey)

    const usersRes = await fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/users?status=ACTIVE`, {
      headers: { "X-Api-Key": apiKey },
    })

    if (!usersRes.ok) {
      throw new Error("Failed to fetch users")
    }

    const users: { id: string; name: string; status: string }[] = await usersRes.json()
    const activeUsers = users.filter(u => u.status === "ACTIVE")
    const userCount = activeUsers.length

    const dailyHours = new Map<string, number>()

    for (const user of activeUsers) {
      const entriesRes = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${user.id}/time-entries?start=${from}T00:00:00Z&end=${to}T23:59:59Z&page-size=1000`,
        { headers: { "X-Api-Key": apiKey } }
      )

      if (entriesRes.ok) {
        const entries: ClockifyTimeEntry[] = await entriesRes.json()
        for (const entry of entries) {
          const date = entry.timeInterval.start.split("T")[0]
          const hours = parseDuration(entry.timeInterval.duration)
          dailyHours.set(date, (dailyHours.get(date) || 0) + hours)
        }
      }
    }

    const data = Array.from(dailyHours.entries())
      .map(([date, hours]) => ({
        date,
        hours: Math.round(hours * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ data, userCount })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
