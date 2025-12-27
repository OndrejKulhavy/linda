import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { determineLateType } from '@/utils/attendance-helpers'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const sessionId = searchParams.get('sessionId')
  const employeeName = searchParams.get('employeeName')

  let query = supabase
    .from('attendance_records')
    .select(`
      *,
      sessions (*)
    `)
    .order('created_at', { ascending: false })

  if (sessionId) {
    query = query.eq('session_id', sessionId)
  }
  if (employeeName) {
    query = query.ilike('employee_name', `%${employeeName}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ records: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { session_id, employee_name, status, late_type, notes } = body

  if (!session_id || !employee_name || !status) {
    return NextResponse.json(
      { error: 'session_id, employee_name, and status are required' },
      { status: 400 }
    )
  }

  // Get session details for late type auto-detection
  let finalLateType = late_type

  if (status === 'late' && !late_type) {
    const { data: session } = await supabase
      .from('sessions')
      .select('start_time, date')
      .eq('id', session_id)
      .single()

    if (session) {
      finalLateType = determineLateType(session.start_time, session.date)
    }
  }

  // Upsert attendance record (update if exists for same session + employee)
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(
      {
        session_id,
        employee_name,
        status,
        late_type: status === 'late' ? finalLateType : null,
        notes,
        created_by: user.id,
      },
      {
        onConflict: 'session_id,employee_name',
      }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ record: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // If status is not 'late', clear late_type
  if (updates.status && updates.status !== 'late') {
    updates.late_type = null
  }

  const { data, error } = await supabase
    .from('attendance_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ record: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('attendance_records')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
