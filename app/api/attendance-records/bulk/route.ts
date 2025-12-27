import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { determineLateType } from '@/utils/attendance-helpers'

interface BulkAttendanceEntry {
  session_id: string
  employee_name: string
  status: string
  late_type?: string
  notes?: string
}

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { entries } = body as { entries: BulkAttendanceEntry[] }

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json(
      { error: 'entries array is required and must not be empty' },
      { status: 400 }
    )
  }

  // Get unique session IDs for late type detection
  const sessionIds = [...new Set(entries.map(e => e.session_id))]
  
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, start_time, date')
    .in('id', sessionIds)

  const sessionMap = new Map(sessions?.map(s => [s.id, s]) || [])

  // Process entries with auto late type detection
  const processedEntries = entries.map(entry => {
    let finalLateType = entry.late_type

    if (entry.status === 'late' && !entry.late_type) {
      const session = sessionMap.get(entry.session_id)
      if (session) {
        finalLateType = determineLateType(session.start_time, session.date)
      }
    }

    return {
      session_id: entry.session_id,
      employee_name: entry.employee_name,
      status: entry.status,
      late_type: entry.status === 'late' ? finalLateType : null,
      notes: entry.notes || null,
      created_by: user.id,
    }
  })

  // Upsert all entries
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(processedEntries, {
      onConflict: 'session_id,employee_name',
    })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { records: data, count: data?.length || 0 },
    { status: 201 }
  )
}
