import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/resend"
import { getRandomLindaMessage, getEmailSubject } from "@/lib/linda-messages"
import { calculateExpectedHours } from "@/lib/czech-holidays"

// Remind if logged hours are less than this percentage of expected hours
const THRESHOLD_PERCENTAGE = 0.75 // 75% of expected hours (e.g., 30h out of 40h)

interface ClockifyUser {
  id: string
  name: string
  email: string
  status: string
}

interface ClockifyTimeEntry {
  projectId: string | null
  timeInterval: {
    duration: string | null
  }
}

interface ClockifyProject {
  id: string
  name: string
}

// Project names to exclude from hours calculation
const EXCLUDED_PROJECTS = ["Osobní"]

// TEST MODE: Only send to these emails (empty array = send to everyone)
const TEST_EMAILS = ["okulhav@gmail.com"]

function parseDuration(duration: string | null): number {
  if (!duration) return 0
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2] || "0", 10)
  const seconds = parseInt(match[3] || "0", 10)
  return hours + minutes / 60 + seconds / 3600
}

function getWeekDateRange(): { from: string; to: string } {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1))
  monday.setHours(0, 0, 0, 0)

  return {
    from: monday.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  }
}

function getFirstName(fullName: string): string {
  return fullName.split(" ")[0]
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.CLOCKIFY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "CLOCKIFY_API_KEY not configured" }, { status: 500 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 })
  }

  try {
    // Get workspace ID
    const userRes = await fetch("https://api.clockify.me/api/v1/user", {
      headers: { "X-Api-Key": apiKey },
    })
    if (!userRes.ok) throw new Error("Failed to fetch Clockify user")
    const currentUser = await userRes.json()
    const workspaceId = currentUser.defaultWorkspace

    // Get all users with emails using POST endpoint
    const usersRes = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${workspaceId}/users/info`,
      {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "ACTIVE",
          page: 1,
          pageSize: 100,
        }),
      }
    )

    if (!usersRes.ok) {
      throw new Error(`Failed to fetch users: ${usersRes.status}`)
    }

    const users: ClockifyUser[] = await usersRes.json()
    
    // Fetch projects to identify excluded ones (e.g., "Osobní")
    const projectsRes = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects?page-size=500`,
      { headers: { "X-Api-Key": apiKey } }
    )
    const projects: ClockifyProject[] = projectsRes.ok ? await projectsRes.json() : []
    const excludedProjectIds = new Set(
      projects
        .filter((p) => EXCLUDED_PROJECTS.includes(p.name))
        .map((p) => p.id)
    )

    const { from, to } = getWeekDateRange()

    // Calculate expected hours based on working days (excluding weekends and Czech holidays)
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const { workingDays, expectedHours, holidays } = calculateExpectedHours(fromDate, toDate)
    const hoursThreshold = expectedHours * THRESHOLD_PERCENTAGE

    // Skip reminders if there's more than one holiday this week (e.g., Christmas week)
    if (holidays.length > 1) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Week has ${holidays.length} holidays - skipping reminders`,
        dateRange: { from, to },
        workingDays,
        expectedHours,
        holidays: holidays.map((h) => ({ date: h.date.toISOString().split("T")[0], name: h.name })),
      })
    }

    const results: {
      user: string
      email: string
      hours: number
      expectedHours: number
      threshold: number
      emailSent: boolean
    }[] = []

    for (const user of users) {
      if (!user.email) continue
      
      // TEST MODE: Skip users not in test list
      if (TEST_EMAILS.length > 0 && !TEST_EMAILS.includes(user.email)) continue

      // Get user's time entries for this week
      const entriesRes = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${workspaceId}/user/${user.id}/time-entries?start=${from}T00:00:00Z&end=${to}T23:59:59Z&page-size=1000`,
        { headers: { "X-Api-Key": apiKey } }
      )

      if (!entriesRes.ok) continue

      const entries: ClockifyTimeEntry[] = await entriesRes.json()
      // Filter out excluded projects (e.g., "Osobní") from hours calculation
      const totalHours = entries
        .filter((entry) => !entry.projectId || !excludedProjectIds.has(entry.projectId))
        .reduce((sum, entry) => sum + parseDuration(entry.timeInterval.duration), 0)

      // If under threshold, send reminder
      if (totalHours < hoursThreshold) {
        const firstName = getFirstName(user.name)
        const html = getRandomLindaMessage({ name: firstName, hours: totalHours, expectedHours })
        const subject = getEmailSubject()

        const emailResult = await sendEmail({
          to: user.email,
          subject,
          html,
        })

        results.push({
          user: user.name,
          email: user.email,
          hours: Math.round(totalHours * 10) / 10,
          expectedHours,
          threshold: Math.round(hoursThreshold * 10) / 10,
          emailSent: emailResult.success,
        })
      } else {
        results.push({
          user: user.name,
          email: user.email,
          hours: Math.round(totalHours * 10) / 10,
          expectedHours,
          threshold: Math.round(hoursThreshold * 10) / 10,
          emailSent: false, // No need to send - hours are good
        })
      }
    }

    const emailsSent = results.filter((r) => r.emailSent).length
    const usersUnderThreshold = results.filter((r) => r.hours < hoursThreshold).length

    return NextResponse.json({
      success: true,
      dateRange: { from, to },
      workingDays,
      expectedHours,
      holidays: holidays.map((h) => ({ date: h.date.toISOString().split("T")[0], name: h.name })),
      threshold: Math.round(hoursThreshold * 10) / 10,
      summary: {
        totalUsers: results.length,
        usersUnderThreshold,
        emailsSent,
      },
      details: results,
    })
  } catch (error) {
    console.error("Linda reminder error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
