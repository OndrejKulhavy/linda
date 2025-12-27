import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface BulkAttendanceEntry {
  session_id: string
  employee_name: string
  status: string
  // New late tracking fields
  late_start?: boolean
  late_break_count?: number
  // Legacy field
  late_type?: string
  notes?: string
  absence_reason?: string
  absence_excused?: boolean
  excuse_teams_url?: string
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

  // Process entries
  const processedEntries = entries.map(entry => {
    const isPresent = entry.status === 'present'
    const isAbsence = entry.status === 'absent_planned' || entry.status === 'absent_unplanned'

    return {
      session_id: entry.session_id,
      employee_name: entry.employee_name,
      status: entry.status,
      // New late fields - only for present people
      late_start: isPresent ? (entry.late_start ?? false) : false,
      late_break_count: isPresent ? (entry.late_break_count ?? 0) : 0,
      // Legacy field - keep null for new records
      late_type: null,
      notes: entry.notes || null,
      absence_reason: isAbsence ? (entry.absence_reason || null) : null,
      absence_excused: isAbsence ? (entry.absence_excused ?? false) : false,
      excuse_teams_url: isAbsence ? (entry.excuse_teams_url || null) : null,
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
