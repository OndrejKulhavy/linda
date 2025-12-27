'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  X,
  Check,
  Clock,
  Coffee,
  XCircle,
  Calendar,
  AlertTriangle,
  User,
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
  if (record.status === 'absent_planned') return 'Plánovaná absence'
  if (record.status === 'absent_unplanned') return 'Neplánovaná absence'
  // Present - check if late
  const parts: string[] = []
  if (record.late_start) parts.push('pozdě na začátek')
  if (record.late_break_count > 0) parts.push(`${record.late_break_count}× pozdě z přestávky`)
  if (parts.length === 0) return 'Přítomen/a'
  return `Přítomen/a (${parts.join(', ')})`
}

function getStatusColor(record: AttendanceRecord): string {
  if (record.status === 'absent_planned') {
    return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
  }
  if (record.status === 'absent_unplanned') {
    return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950'
  }
  // Present - check if late
  if (record.late_start || record.late_break_count > 0) {
    return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950'
  }
  return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950'
}

export default function AttendanceSummary({
  session,
  onClose,
}: AttendanceSummaryProps) {
  const stats = useMemo(() => calculateSessionStats(session), [session])
  const issues = useMemo(() => getIssueRecords(session.attendance_records || []), [session])

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
          <div className="text-[10px] sm:text-xs text-muted-foreground">Plán. abs.</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.absentUnplanned}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">Nepl. abs.</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {hasNoRecords ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <User className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Docházka pro tuto session zatím nebyla zaznamenána.
            </p>
          </div>
        ) : hasNoIssues ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-1">
              Vše v pořádku! 🎉
            </h3>
            <p className="text-sm text-muted-foreground">
              Všichni členové byli přítomni včas.
            </p>
            <Badge variant="outline" className="mt-3">
              {stats.present} přítomných z {stats.total}
            </Badge>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>
                {issues.length} {issues.length === 1 ? 'problém' : issues.length < 5 ? 'problémy' : 'problémů'}
              </span>
            </div>

            <div className="space-y-2">
              {issues.map(record => {
                const Icon = getStatusIcon(record)
                const statusLabel = getStatusLabel(record)
                const colorClass = getStatusColor(record)

                return (
                  <div
                    key={record.id}
                    className={cn(
                      'rounded-lg border p-3 space-y-2',
                      colorClass
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{record.employee_name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {statusLabel}
                      </Badge>
                    </div>

                    {record.absence_reason && (
                      <div className="text-sm">
                        <span className="font-medium">Důvod: </span>
                        {record.absence_reason}
                        {record.absence_excused && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            Omluveno
                          </Badge>
                        )}
                      </div>
                    )}

                    {record.notes && (
                      <div className="text-sm opacity-80">
                        <span className="font-medium">Poznámka: </span>
                        {record.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Also show present count */}
            {stats.present > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{stats.present} členů bylo přítomno včas</span>
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
