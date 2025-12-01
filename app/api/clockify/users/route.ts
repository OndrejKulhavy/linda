import { NextRequest, NextResponse } from "next/server"
import { validateDateRange, fetchCurrentUser } from "@/utils/clockify"

interface ClockifyTimeEntry {
  id: string
  description: string
  userId: string
  projectId: string
  timeInterval: {
    start: string
    end: string | null
    duration: string | null
  }
}

interface ClockifyUser {
  id: string
  name: string
}

interface ClockifyProject {
  id: string
  name: string
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

    const [usersRes, projectsRes] = await Promise.all([
      fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/users`, {
        headers: { "X-Api-Key": apiKey },
      }),
      fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects`, {
        headers: { "X-Api-Key": apiKey },
      }),
    ])

    if (!usersRes.ok || !projectsRes.ok) {
      throw new Error("Failed to fetch workspace data")
    }

    const users: ClockifyUser[] = await usersRes.json()
    const projects: ClockifyProject[] = await projectsRes.json()

    const userMap = new Map(users.map((u) => [u.id, u.name]))
    const projectMap = new Map(projects.map((p) => [p.id, p.name]))

    const allEntries: { userName: string; projectName: string; hours: number }[] = []

    for (const user of users) {
      const entriesRes = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${user.id}/time-entries?start=${from}T00:00:00Z&end=${to}T23:59:59Z&page-size=1000`,
        { headers: { "X-Api-Key": apiKey } }
      )

      if (entriesRes.ok) {
        const entries: ClockifyTimeEntry[] = await entriesRes.json()
        for (const entry of entries) {
          const hours = parseDuration(entry.timeInterval.duration)
          const userName = userMap.get(entry.userId) || user.name
          const projectName = projectMap.get(entry.projectId) || "No Project"
          allEntries.push({ userName, projectName, hours })
        }
      }
    }

    const aggregated = new Map<string, { name: string; project: string; hours: number }>()

    for (const entry of allEntries) {
      const key = `${entry.userName}:${entry.projectName}`
      const existing = aggregated.get(key)
      if (existing) {
        existing.hours += entry.hours
      } else {
        aggregated.set(key, {
          name: entry.userName,
          project: entry.projectName,
          hours: entry.hours,
        })
      }
    }

    const data = Array.from(aggregated.values()).map((item) => ({
      name: item.name,
      project: item.project,
      hours: Math.round(item.hours * 10) / 10,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
