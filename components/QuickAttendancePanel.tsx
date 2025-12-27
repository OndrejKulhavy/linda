'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  X,
  Save,
  Loader2,
  Check,
  Clock,
  Coffee,
  XCircle,
  Calendar,
  Plus,
  Minus,
} from 'lucide-react'
import type {
  SessionWithAttendance,
  AttendanceStatus,
  AttendanceRecord,
} from '@/types/session'
import { TEAM_MEMBERS, getFullName } from '@/lib/team-members'
import {
  formatSessionType,
  formatDate,
  formatTime,
} from '@/utils/attendance-helpers'
import { cn } from '@/lib/utils'

interface QuickAttendancePanelProps {
  session: SessionWithAttendance
  onClose: () => void
  onSave: () => void
}

interface AttendanceEntry {
  status: AttendanceStatus // 'present' | 'absent_planned' | 'absent_unplanned'
  late_start: boolean
  late_break_count: number
  absence_reason?: string
  absence_excused?: boolean
  excuse_teams_url?: string
}

// Default entry: present, on time
const DEFAULT_ENTRY: AttendanceEntry = {
  status: 'present',
  late_start: false,
  late_break_count: 0,
  absence_excused: false,
  excuse_teams_url: undefined,
}

export default function QuickAttendancePanel({
  session,
  onClose,
  onSave,
}: QuickAttendancePanelProps) {
  const [attendance, setAttendance] = useState<Map<string, AttendanceEntry>>(new Map())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize from existing records
  useEffect(() => {
    const initial = new Map<string, AttendanceEntry>()
    session.attendance_records?.forEach((record: AttendanceRecord) => {
      // Handle legacy 'late' status by converting to present + late_start
      const isLegacyLate = (record.status as string) === 'late'
      initial.set(record.employee_name, {
        status: isLegacyLate ? 'present' : record.status,
        late_start: record.late_start ?? (isLegacyLate && record.late_type === 'start'),
        late_break_count: record.late_break_count ?? (isLegacyLate && record.late_type === 'after_break' ? 1 : 0),
        absence_reason: record.absence_reason || undefined,
        absence_excused: record.absence_excused ?? false,
        excuse_teams_url: record.excuse_teams_url || undefined,
      })
    })
    setAttendance(initial)
  }, [session])

  const getEntry = (name: string): AttendanceEntry => {
    return attendance.get(name) || DEFAULT_ENTRY
  }

  const updateEntry = (name: string, updates: Partial<AttendanceEntry>) => {
    setAttendance(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(name) || { ...DEFAULT_ENTRY }
      newMap.set(name, { ...existing, ...updates })
      return newMap
    })
  }

  // type: 'excused' = they made an excuse, 'unexcused' = they just didn't come
  const toggleAbsent = (name: string, type: 'excused' | 'unexcused') => {
    setAttendance(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(name) || { ...DEFAULT_ENTRY }
      const newStatus = type === 'excused' ? 'absent_planned' : 'absent_unplanned'
      
      if (existing.status === newStatus) {
        // Toggle off - back to present
        newMap.set(name, { 
          ...existing, 
          status: 'present',
          absence_reason: undefined,
          excuse_teams_url: undefined,
        })
      } else {
        // Set to absent
        newMap.set(name, { 
          ...existing, 
          status: newStatus,
          late_start: false, // Can't be late if absent
          late_break_count: 0,
          // Clear excuse fields if switching to unexcused
          absence_reason: type === 'excused' ? existing.absence_reason : undefined,
          excuse_teams_url: type === 'excused' ? existing.excuse_teams_url : undefined,
        })
      }
      return newMap
    })
  }

  const toggleLateStart = (name: string) => {
    setAttendance(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(name) || { ...DEFAULT_ENTRY }
      
      // Can only toggle late if present
      if (existing.status === 'present') {
        newMap.set(name, { ...existing, late_start: !existing.late_start })
      }
      return newMap
    })
  }

  const adjustLateBreak = (name: string, delta: number) => {
    setAttendance(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(name) || { ...DEFAULT_ENTRY }
      
      // Can only adjust if present
      if (existing.status === 'present') {
        const newCount = Math.max(0, existing.late_break_count + delta)
        newMap.set(name, { ...existing, late_break_count: newCount })
      }
      return newMap
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Build entries for all team members
      const entries = TEAM_MEMBERS.map(member => {
        const fullName = getFullName(member)
        const entry = getEntry(fullName)
        const isExcused = entry.status === 'absent_planned'
        
        return {
          session_id: session.id,
          employee_name: fullName,
          status: entry.status,
          late_start: entry.status === 'present' ? entry.late_start : false,
          late_break_count: entry.status === 'present' ? entry.late_break_count : 0,
          // Excused absences get the excuse fields
          absence_reason: isExcused ? entry.absence_reason || undefined : undefined,
          absence_excused: isExcused, // Calendar = excused, X = unexcused
          excuse_teams_url: isExcused ? entry.excuse_teams_url || undefined : undefined,
        }
      })

      const response = await fetch('/api/attendance-records/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Nepodařilo se uložit')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Došlo k chybě')
    } finally {
      setSaving(false)
    }
  }

  // Calculate stats
  const stats = TEAM_MEMBERS.reduce(
    (acc, member) => {
      const entry = getEntry(getFullName(member))
      if (entry.status === 'present') {
        acc.present++
        if (entry.late_start) acc.lateStart++
        acc.lateBreak += entry.late_break_count
      } else if (entry.status === 'absent_planned') {
        acc.absentPlanned++
      } else if (entry.status === 'absent_unplanned') {
        acc.absentUnplanned++
      }
      return acc
    },
    { present: 0, lateStart: 0, lateBreak: 0, absentPlanned: 0, absentUnplanned: 0 }
  )

  return (
    <div className="h-full max-h-[85vh] flex flex-col bg-background rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-3 sm:p-4 border-b shrink-0 bg-card">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold truncate">{session.title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {formatSessionType(session.type)} • {formatDate(session.date)} • {formatTime(session.start_time)}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950">
              <Check className="w-3 h-3 mr-1" />
              {stats.present}
            </Badge>
            {(stats.lateStart > 0 || stats.lateBreak > 0) && (
              <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950">
                <Clock className="w-3 h-3 mr-1" />
                {stats.lateStart > 0 && `${stats.lateStart}× zač.`}
                {stats.lateStart > 0 && stats.lateBreak > 0 && ', '}
                {stats.lateBreak > 0 && `${stats.lateBreak}× přest.`}
              </Badge>
            )}
            {(stats.absentPlanned > 0 || stats.absentUnplanned > 0) && (
              <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950">
                <XCircle className="w-3 h-3 mr-1" />
                {stats.absentPlanned + stats.absentUnplanned} abs.
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="px-3 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
        Všichni jsou přítomni včas. Označte kdo přišel pozdě nebo chyběl.
      </div>

      {/* Member List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3">
        <div className="space-y-2 pb-4">
          {TEAM_MEMBERS.map(member => {
            const fullName = getFullName(member)
            const entry = getEntry(fullName)
            const isAbsent = entry.status !== 'present'
            const isLate = entry.late_start || entry.late_break_count > 0

            return (
              <div key={fullName} className="space-y-1">
                {/* Main row */}
                <div
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border transition-all',
                    isAbsent
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                      : isLate
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                        : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                  )}
                >
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{member.firstName}</div>
                    <div className="text-xs text-muted-foreground truncate hidden sm:block">
                      {member.lastName}
                    </div>
                  </div>

                  {/* Late toggles (only if present) */}
                  {!isAbsent && (
                    <div className="flex items-center gap-1">
                      {/* Late at start */}
                      <button
                        onClick={() => toggleLateStart(fullName)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all',
                          entry.late_start
                            ? 'bg-amber-200 dark:bg-amber-800 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200'
                            : 'bg-card border-border text-muted-foreground hover:bg-muted'
                        )}
                        title="Pozdě na začátek"
                      >
                        <Clock className="w-3 h-3" />
                        <span className="hidden sm:inline">Zač</span>
                      </button>

                      {/* Late from break with counter */}
                      <div className="flex items-center rounded border bg-card">
                        <button
                          onClick={() => adjustLateBreak(fullName, -1)}
                          disabled={entry.late_break_count === 0}
                          className="p-1 hover:bg-muted disabled:opacity-30 rounded-l"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span
                          className={cn(
                            'px-1.5 text-xs font-medium min-w-7 text-center',
                            entry.late_break_count > 0
                              ? 'text-orange-700 dark:text-orange-400'
                              : 'text-muted-foreground'
                          )}
                          title="Pozdě z přestávky"
                        >
                          <Coffee className="w-3 h-3 inline mr-0.5" />
                          {entry.late_break_count}
                        </span>
                        <button
                          onClick={() => adjustLateBreak(fullName, 1)}
                          className="p-1 hover:bg-muted rounded-r"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Absence toggles */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleAbsent(fullName, 'excused')}
                      className={cn(
                        'p-1.5 rounded border transition-all',
                        entry.status === 'absent_planned'
                          ? 'bg-blue-200 dark:bg-blue-800 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200'
                          : 'bg-card border-border text-muted-foreground hover:bg-muted'
                      )}
                      title="Omluvená absence"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleAbsent(fullName, 'unexcused')}
                      className={cn(
                        'p-1.5 rounded border transition-all',
                        entry.status === 'absent_unplanned'
                          ? 'bg-red-200 dark:bg-red-800 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200'
                          : 'bg-card border-border text-muted-foreground hover:bg-muted'
                      )}
                      title="Neomluvená absence"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details - only for excused absences */}
                {entry.status === 'absent_planned' && (
                  <div className="ml-4 p-2 bg-muted/50 rounded-lg border space-y-2">
                    <Input
                      placeholder="Omluva / důvod"
                      value={entry.absence_reason || ''}
                      onChange={(e) =>
                        updateEntry(fullName, { absence_reason: e.target.value })
                      }
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="URL na Teams komentář"
                      value={entry.excuse_teams_url || ''}
                      onChange={(e) =>
                        updateEntry(fullName, { excuse_teams_url: e.target.value })
                      }
                      className="h-8 text-sm"
                      type="url"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950 rounded">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t shrink-0 bg-card">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Ukládám...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Uložit ({stats.present} přít.
              {stats.lateStart + stats.lateBreak > 0 && `, ${stats.lateStart + stats.lateBreak}× pozdě`}
              {stats.absentPlanned + stats.absentUnplanned > 0 && `, ${stats.absentPlanned + stats.absentUnplanned} abs.`})
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
