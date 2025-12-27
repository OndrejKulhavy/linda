export type SessionType = 'training_session' | 'team_meeting'

// Status indicates if person was there or not
export type AttendanceStatus = 'present' | 'absent_planned' | 'absent_unplanned'

// Legacy - keeping for backwards compatibility during migration
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
  // Late tracking - person can be late at start AND/OR late from breaks
  late_start: boolean
  late_break_count: number
  // Legacy field - kept for migration
  late_type: LateType | null
  notes: string | null
  absence_reason: string | null
  absence_excused: boolean
  // URL to MS Teams comment where they excused themselves
  excuse_teams_url: string | null
  created_by: string
  created_at: string
}

export interface SessionWithAttendance extends Session {
  attendance_records: AttendanceRecord[]
}

// Computed stats for a session
export interface SessionAttendanceStats {
  total: number
  present: number
  late: number
  lateStart: number
  lateAfterBreak: number
  absentPlanned: number
  absentUnplanned: number
  notRecorded: number
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
