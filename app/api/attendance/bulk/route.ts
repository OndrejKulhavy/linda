import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { AttendanceInsert } from '@/types/attendance'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entries }: { entries: AttendanceInsert[] } = await request.json()

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: 'No entries provided' }, { status: 400 })
  }

  // Add created_by to all entries
  const entriesWithUser = entries.map(entry => ({
    ...entry,
    created_by: user.id,
  }))

  const { data, error } = await supabase
    .from('attendance')
    .insert(entriesWithUser)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
