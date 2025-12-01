import { NextRequest, NextResponse } from "next/server"
import { validateDateRange, fetchClockifyData, normalizeClockifyData, fetchCurrentUser } from "@/utils/clockify"

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
    const { id: userId, defaultWorkspace: workspaceId } = await fetchCurrentUser(apiKey)
    const entries = await fetchClockifyData(apiKey, workspaceId, userId, from!, to!)
    const normalizedData = normalizeClockifyData(entries)
    return NextResponse.json({ data: normalizedData })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
