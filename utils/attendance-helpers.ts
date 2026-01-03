import type { LateType, SessionType, SessionWithAttendance, SessionAttendanceStats, AttendanceRecord } from '@/types/session'
import { TEAM_MEMBERS } from '@/lib/team-members'

/**
 * Determines the late type based on current time and session start time.
 * If within first 15 minutes of session start, it's 'start'.
 * Otherwise, it's 'after_break'.
 */
export function determineLateType(
  sessionStartTime: string,
  sessionDate: string,
  currentTime?: Date
): LateType {
  const now = currentTime || new Date()
  
  // Parse session start time (HH:MM format)
  const [hours, minutes] = sessionStartTime.split(':').map(Number)
  
  // Create session start datetime
  const sessionStart = new Date(sessionDate)
  sessionStart.setHours(hours, minutes, 0, 0)
  
  // Calculate difference in minutes
  const diffMs = now.getTime() - sessionStart.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  // If within first 15 minutes, it's late to start
  if (diffMinutes <= 15) {
    return 'start'
  }
  
  // Otherwise, assume it's after break
  return 'after_break'
}

/**
 * Calculate attendance statistics for a session
 */
export function calculateSessionStats(session: SessionWithAttendance): SessionAttendanceStats {
  const total = TEAM_MEMBERS.length
  const records = session.attendance_records || []
  
  let late = 0 // Number of people who were late (each person counted once)
  let lateStart = 0 // Number of people late at start
  let lateAfterBreak = 0 // Total number of late returns from breaks (can be multiple per person)
  let absentPlanned = 0
  let absentUnplanned = 0
  
  records.forEach(record => {
    switch (record.status) {
      case 'present':
        // Count people who were late (present but with late flags)
        if (record.late_start || record.late_break_count > 0) {
          late++
          if (record.late_start) {
            lateStart++
          }
          if (record.late_break_count > 0) {
            lateAfterBreak += record.late_break_count
          }
        }
        break
      case 'absent_planned':
        absentPlanned++
        break
      case 'absent_unplanned':
        absentUnplanned++
        break
    }
  })
  
  // Present = everyone who is not absent (includes late arrivals)
  // By default, everyone is present unless they have an absence record
  const totalAbsent = absentPlanned + absentUnplanned
  const present = total - totalAbsent
  
  const notRecorded = total - records.length
  
  return {
    total,
    present,
    late,
    lateStart,
    lateAfterBreak,
    absentPlanned,
    absentUnplanned,
    notRecorded,
  }
}

/**
 * Get records with issues (late or absent)
 */
export function getIssueRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  return records.filter(r => {
    // Absent
    if (r.status !== 'present') return true
    // Late (present but arrived late)
    if (r.late_start || r.late_break_count > 0) return true
    return false
  })
}

/**
 * Check if session has any attendance recorded
 */
export function hasAttendanceRecorded(session: SessionWithAttendance): boolean {
  return (session.attendance_records?.length || 0) > 0
}

/**
 * Format session type for display
 */
export function formatSessionType(type: SessionType): string {
  switch (type) {
    case 'training_session':
      return 'Training Session'
    case 'team_meeting':
      return 'Team Meeting'
    default:
      return type
  }
}

/**
 * Get session type abbreviation
 */
export function getSessionTypeAbbreviation(type: SessionType): string {
  switch (type) {
    case 'training_session':
      return 'TS'
    case 'team_meeting':
      return 'TM'
    default:
      return '?'
  }
}

/**
 * Format attendance status for display
 */
export function formatAttendanceStatus(status: string): string {
  switch (status) {
    case 'present':
      return 'Present'
    case 'late':
      return 'Late'
    case 'absent_planned':
      return 'Absent (Planned)'
    case 'absent_unplanned':
      return 'Absent (Unplanned)'
    default:
      return status
  }
}

/**
 * Format late type for display
 */
export function formatLateType(lateType: LateType | null): string {
  if (!lateType) return ''
  switch (lateType) {
    case 'start':
      return 'Late to Start'
    case 'after_break':
      return 'Late After Break'
    default:
      return lateType
  }
}

/**
 * Get color class for session type
 */
export function getSessionTypeColor(type: SessionType): string {
  switch (type) {
    case 'training_session':
      return 'bg-blue-500'
    case 'team_meeting':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

/**
 * Get color class for attendance status
 */
export function getAttendanceStatusColor(status: string): string {
  switch (status) {
    case 'present':
      return 'text-green-600 dark:text-green-400'
    case 'late':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'absent_planned':
      return 'text-orange-600 dark:text-orange-400'
    case 'absent_unplanned':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

/**
 * Format time string (HH:MM) for display
 */
export function formatTime(time: string): string {
  return time.slice(0, 5) // Ensure HH:MM format
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('cs-CZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
