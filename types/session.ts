export type SessionType = 'training_session' | 'team_meeting'

export type AttendanceStatus = 'present' | 'late' | 'absent_planned' | 'absent_unplanned'

export type LateType = 'start' | 'after_break'

export interface Session {
  id: string
  google_event_id: string
  title: string
  type: SessionType
  date: string
  start_time: string
  end_time: string
  google_deleted: boolean
  synced_at: string
  created_at: string
}

export interface AttendanceRecord {
  id: string
  session_id: string
  employee_name: string
  status: AttendanceStatus
  late_type: LateType | null
  notes: string | null
  created_by: string
  created_at: string
}

export interface SessionWithAttendance extends Session {
  attendance_records: AttendanceRecord[]
}

export interface GoogleCalendarEvent {
  id: string
  summary: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
}

export interface SyncResult {
  synced: number
  created: number
  updated: number
  markedDeleted: number
}
