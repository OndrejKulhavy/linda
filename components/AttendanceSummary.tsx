'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  X,
  Check,
  Clock,
  Coffee,
  XCircle,
  Calendar,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { SessionWithAttendance, AttendanceRecord } from '@/types/session'
import {
  formatSessionType,
  formatDate,
  formatTime,
  calculateSessionStats,
  getIssueRecords,
} from '@/utils/attendance-helpers'
import { cn } from '@/lib/utils'

interface AttendanceSummaryProps {
  session: SessionWithAttendance
  onClose: () => void
}

function getStatusIcon(record: AttendanceRecord) {
  if (record.status === 'absent_planned') return Calendar
  if (record.status === 'absent_unplanned') return XCircle
  // Present - check if late
  if (record.late_start && record.late_break_count > 0) return Clock // Both
  if (record.late_start) return Clock
  if (record.late_break_count > 0) return Coffee
  return Check
}

function getStatusLabel(record: AttendanceRecord): string {
  if (record.status === 'absent_planned') return 'Omluvená absence'
  if (record.status === 'absent_unplanned') return 'Neomluvená absence'
  // Present - check if late
  const parts: string[] = []
  if (record.late_start) parts.push('pozdě na začátek')
  if (record.late_break_count > 0) parts.push(`${record.late_break_count}× pozdě z přestávky`)
  if (parts.length === 0) return 'Přítomen/a'
  return `Přítomen/a (${parts.join(', ')})`
}

export default function AttendanceSummary({
  session,
  onClose,
}: AttendanceSummaryProps) {
  const stats = useMemo(() => calculateSessionStats(session), [session])
  const issues = useMemo(() => getIssueRecords(session.attendance_records || []), [session])
  const [lateExpanded, setLateExpanded] = useState(false)

  // Separate absences from late arrivals
  const absences = useMemo(() => issues.filter(r => r.status !== 'present'), [issues])
  const lateArrivals = useMemo(() => issues.filter(r => r.status === 'present'), [issues])

  const hasNoRecords = stats.total === 0
  const hasNoIssues = issues.length === 0 && !hasNoRecords

  return (
    <div className="h-full flex flex-col bg-background border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-3 sm:p-4 border-b shrink-0 bg-card">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold truncate">{session.title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {formatSessionType(session.type)} • {formatDate(session.date)} • {formatTime(session.start_time)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-2 p-3 sm:p-4 border-b bg-muted/30">
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.present}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">Přítomni</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.late}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">Pozdě</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.absentPlanned}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">Omluveno</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.absentUnplanned}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">Neomluv.</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {hasNoRecords ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <User className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Docházka pro tuto schůzku zatím nebyla zaznamenána.
            </p>
          </div>
        ) : hasNoIssues ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-1">
              Plná účast
            </h3>
            <p className="text-sm text-muted-foreground">
              Všichni členové byli přítomni včas.
            </p>
            <Badge variant="outline" className="mt-3">
              {stats.present} z {stats.total} přítomno
            </Badge>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Absences section */}
            {absences.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Absence
                </h3>
                {absences.map(record => {
                  const Icon = getStatusIcon(record)
                  const statusLabel = getStatusLabel(record)

                  return (
                    <div
                      key={record.id}
                      className={cn(
                        'rounded-xl border p-4',
                        record.status === 'absent_planned'
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50'
                          : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                            record.status === 'absent_planned'
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                              : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold">{record.employee_name}</div>
                            <div className={cn(
                              'text-sm',
                              record.status === 'absent_planned'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-red-600 dark:text-red-400'
                            )}>
                              {statusLabel}
                            </div>
                          </div>
                        </div>
                      </div>

                      {(record.absence_reason || record.excuse_teams_url) && (
                        <div className="mt-3 pt-3 border-t border-current/10">
                          {record.excuse_teams_url ? (
                            <a
                              href={record.excuse_teams_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center justify-between text-sm text-foreground/80 hover:text-foreground transition-colors"
                            >
                              <span className="group-hover:underline">
                                {record.absence_reason || 'Zobrazit omluvu'}
                              </span>
                              <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                            </a>
                          ) : (
                            <p className="text-sm text-foreground/80">
                              {record.absence_reason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Late arrivals section - collapsible */}
            {lateArrivals.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setLateExpanded(!lateExpanded)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Pozdní příchody ({lateArrivals.length})
                  </h3>
                  <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {lateExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {lateExpanded && (
                  <div className="space-y-2">
                    {lateArrivals.map(record => {
                      const Icon = getStatusIcon(record)
                      const statusLabel = getStatusLabel(record)

                      return (
                        <div
                          key={record.id}
                          className="rounded-lg border p-3 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{record.employee_name}</div>
                              <div className="text-xs text-amber-600 dark:text-amber-400">
                                {statusLabel}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!lateExpanded && (
                  <div className="flex flex-wrap gap-1.5">
                    {lateArrivals.map(record => (
                      <Badge
                        key={record.id}
                        variant="outline"
                        className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {record.employee_name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Present count at bottom */}
            {stats.present - stats.late > 0 && (
              <div className="pt-3 mt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span>{stats.present - stats.late} členů přítomno včas</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t text-xs text-muted-foreground text-center bg-muted/30">
        Pro úpravu docházky se přihlaste jako admin.
      </div>
    </div>
  )
}
