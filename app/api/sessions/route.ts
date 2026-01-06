import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  fetchCalendarEvents,
  getDefaultSyncRange,
  parseEventType,
  parseEventDateTime,
} from '@/lib/google-calendar'
import type { SyncResult } from '@/types/session'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const type = searchParams.get('type')
  const includeDeleted = searchParams.get('includeDeleted') === 'true'

  let query = supabase
    .from('sessions')
    .select(`
      *,
      attendance_records (*)
    `)
    .order('date', { ascending: false })
    .order('start_time', { ascending: true })

  if (!includeDeleted) {
    query = query.eq('google_deleted', false)
  }

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }
  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessions: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check last sync time to prevent too frequent syncs
    const { data: lastSession } = await supabase
      .from('sessions')
      .select('synced_at')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single()

    if (lastSession?.synced_at) {
      const lastSyncTime = new Date(lastSession.synced_at)
      const now = new Date()
      const diffMinutes = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60)
      
      // Allow sync if more than 5 minutes have passed
      if (diffMinutes < 5) {
        return NextResponse.json({
          message: 'Sync skipped - last sync was less than 5 minutes ago',
          skipped: true,
          lastSyncAt: lastSession.synced_at,
        })
      }
    }

    // Fetch events from Google Calendar
    const { timeMin, timeMax } = getDefaultSyncRange()
    const events = await fetchCalendarEvents(timeMin, timeMax)

    const result: SyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      markedDeleted: 0,
    }

    const syncedAt = new Date().toISOString()
    const googleEventIds: string[] = []

    // Process each event
    for (const event of events) {
      const eventType = parseEventType(event.summary)
      const dateTime = parseEventDateTime(event)

      if (!eventType || !dateTime) continue

      googleEventIds.push(event.id)

      // Upsert session
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('google_event_id', event.id)
        .single()

      if (existingSession) {
        // Update existing session
        await supabase
          .from('sessions')
          .update({
            title: event.summary,
            type: eventType,
            date: dateTime.date,
            start_time: dateTime.startTime,
            end_time: dateTime.endTime,
            description: event.description || null,
            google_deleted: false,
            synced_at: syncedAt,
          })
          .eq('google_event_id', event.id)

        result.updated++
      } else {
        // Create new session
        await supabase
          .from('sessions')
          .insert({
            google_event_id: event.id,
            title: event.summary,
            type: eventType,
            date: dateTime.date,
            start_time: dateTime.startTime,
            end_time: dateTime.endTime,
            description: event.description || null,
            google_deleted: false,
            synced_at: syncedAt,
          })

        result.created++
      }

      result.synced++
    }

    // Mark sessions as deleted if they're no longer in Google Calendar
    // Only for sessions within the sync range
    if (googleEventIds.length > 0) {
      const { data: sessionsToMark } = await supabase
        .from('sessions')
        .select('id, google_event_id')
        .gte('date', timeMin.toISOString().split('T')[0])
        .lte('date', timeMax.toISOString().split('T')[0])
        .eq('google_deleted', false)

      if (sessionsToMark) {
        for (const session of sessionsToMark) {
          if (!googleEventIds.includes(session.google_event_id)) {
            await supabase
              .from('sessions')
              .update({ google_deleted: true, synced_at: syncedAt })
              .eq('id', session.id)

            result.markedDeleted++
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Sync completed successfully',
      result,
      syncedAt,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
