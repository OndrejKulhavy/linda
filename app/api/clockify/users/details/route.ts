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
  const userName = searchParams.get("userName")

  if (!userName) {
    return NextResponse.json({ error: "userName is required" }, { status: 400 })
  }

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

    // Fetch projects
    const projectsRes = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects`,
      { headers: { "X-Api-Key": apiKey } }
    )

    if (!projectsRes.ok) {
      throw new Error("Failed to fetch projects")
    }

    const projects: ClockifyProject[] = await projectsRes.json()
    const projectMap = new Map(projects.map((p) => [p.id, p.name]))

    // Fetch all users to find the user by name
    const usersRes = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${workspaceId}/users`,
      { headers: { "X-Api-Key": apiKey } }
    )

    if (!usersRes.ok) {
      throw new Error("Failed to fetch users")
    }

    const users: ClockifyUser[] = await usersRes.json()
    
    // Find user by name
    const targetUser = users.find((u) => u.name === userName)

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch time entries for the user
    const entriesRes = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${targetUser.id}/time-entries?start=${from}T00:00:00Z&end=${to}T23:59:59Z&page-size=1000`,
      { headers: { "X-Api-Key": apiKey } }
    )

    if (!entriesRes.ok) {
      throw new Error("Failed to fetch time entries")
    }

    const entries: ClockifyTimeEntry[] = await entriesRes.json()

    // Aggregate hours by project
    const projectHours = new Map<string, number>()
    const tasks: { description: string; project: string; hours: number; date: string }[] = []

    for (const entry of entries) {
      const hours = parseDuration(entry.timeInterval.duration)
      const projectName = projectMap.get(entry.projectId) || "No Project"

      // Aggregate by project
      projectHours.set(projectName, (projectHours.get(projectName) || 0) + hours)

      // Collect tasks
      tasks.push({
        description: entry.description || "Bez popisu",
        project: projectName,
        hours: Math.round(hours * 100) / 100,
        date: entry.timeInterval.start.split("T")[0],
      })
    }

    const projectData = Array.from(projectHours.entries()).map(([name, hours]) => ({
      name,
      hours: Math.round(hours * 10) / 10,
    }))

    // Sort tasks by date descending
    tasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
      },
      projects: projectData,
      tasks,
      totalHours: Math.round(projectData.reduce((sum, p) => sum + p.hours, 0) * 10) / 10,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
