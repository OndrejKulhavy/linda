export type AttendanceType = 'Training Session' | 'Team Meeting'

export interface AttendanceRecord {
  id: string
  created_at: string
  date: string
  time?: string
  employee_name: string
  type: AttendanceType
  created_by: string
  user_email?: string
}

export interface AttendanceInsert {
  date: string
  employee_name: string
  type: AttendanceType
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  created_at: string
}
