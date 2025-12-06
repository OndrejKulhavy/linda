import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceForm from '@/components/AttendanceForm'

export default async function AddAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/attendance/add')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <AttendanceForm />
    </div>
  )
}
