import { google } from 'googleapis'
import type { GoogleCalendarEvent, SessionType } from '@/types/session'

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  
  if (!email || !privateKey) {
    throw new Error('Google service account credentials not configured')
  }

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SCOPES,
  })
}

export function parseEventType(title: string): SessionType | null {
  const trimmedTitle = title.trim().toUpperCase()
  if (trimmedTitle.startsWith('TS')) {
    return 'training_session'
  }
  if (trimmedTitle.startsWith('TM')) {
    return 'team_meeting'
  }
  return null
}

export function parseEventDateTime(event: GoogleCalendarEvent): {
  date: string
  startTime: string
  endTime: string
} | null {
  const startDateTime = event.start.dateTime
  const endDateTime = event.end.dateTime

  if (!startDateTime || !endDateTime) {
    // All-day events don't have specific times, skip them
    return null
  }

  // Parse the ISO string directly to avoid timezone conversion issues
  // Format: 2025-12-02T08:00:00+01:00 or 2025-12-02T08:00:00Z
  // We want to extract the LOCAL time as shown in the calendar
  
  const startMatch = startDateTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  const endMatch = endDateTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  
  if (!startMatch || !endMatch) {
    return null
  }

  return {
    date: `${startMatch[1]}-${startMatch[2]}-${startMatch[3]}`,
    startTime: `${startMatch[4]}:${startMatch[5]}`,
    endTime: `${endMatch[4]}:${endMatch[5]}`,
  }
}

export async function fetchCalendarEvents(
  timeMin: Date,
  timeMax: Date
): Promise<GoogleCalendarEvent[]> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  
  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID not configured')
  }

  const auth = getAuth()
  const calendar = google.calendar({ version: 'v3', auth })

  const events: GoogleCalendarEvent[] = []
  let pageToken: string | undefined

  do {
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
      pageToken,
    })

    const items = response.data.items || []
    
    for (const item of items) {
      if (item.id && item.summary) {
        // Only include events with TS or TM prefix
        const eventType = parseEventType(item.summary)
        if (eventType) {
          events.push({
            id: item.id,
            summary: item.summary,
            start: {
              dateTime: item.start?.dateTime ?? undefined,
              date: item.start?.date ?? undefined,
              timeZone: item.start?.timeZone ?? undefined,
            },
            end: {
              dateTime: item.end?.dateTime ?? undefined,
              date: item.end?.date ?? undefined,
              timeZone: item.end?.timeZone ?? undefined,
            },
          })
        }
      }
    }

    pageToken = response.data.nextPageToken ?? undefined
  } while (pageToken)

  return events
}

export function getDefaultSyncRange(): { timeMin: Date; timeMax: Date } {
  const now = new Date()
  
  // 3 months in the past
  const timeMin = new Date(now)
  timeMin.setMonth(timeMin.getMonth() - 3)
  timeMin.setHours(0, 0, 0, 0)
  
  // 1 month in the future
  const timeMax = new Date(now)
  timeMax.setMonth(timeMax.getMonth() + 1)
  timeMax.setHours(23, 59, 59, 999)
  
  return { timeMin, timeMax }
}
