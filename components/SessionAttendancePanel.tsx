'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Save, Loader2 } from 'lucide-react'
import type { SessionWithAttendance, AttendanceStatus, AttendanceRecord } from '@/types/session'
import { TEAM_MEMBERS, getFullName } from '@/lib/team-members'
import {
  formatSessionType,
  formatDate,
  formatTime,
  getAttendanceStatusColor,
  formatAttendanceStatus,
} from '@/utils/attendance-helpers'

interface SessionAttendancePanelProps {
  session: SessionWithAttendance
  onClose: () => void
  onSave: () => void
  isLoggedIn: boolean
}

interface AttendanceState {
  status: AttendanceStatus | ''
  late_start: boolean
  late_break_count: number
  notes: string
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Přítomen/a' },
  { value: 'absent_planned', label: 'Absence (plánovaná)' },
  { value: 'absent_unplanned', label: 'Absence (neplánovaná)' },
]

export default function SessionAttendancePanel({
  session,
  onClose,
  onSave,
  isLoggedIn,
}: SessionAttendancePanelProps) {
  const [attendance, setAttendance] = useState<Map<string, AttendanceState>>(new Map())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize attendance state from session data
  useEffect(() => {
    const initialState = new Map<string, AttendanceState>()
    
    // Set existing records
    session.attendance_records?.forEach((record: AttendanceRecord) => {
      initialState.set(record.employee_name, {
        status: record.status,
        late_start: record.late_start ?? false,
        late_break_count: record.late_break_count ?? 0,
        notes: record.notes || '',
      })
    })

    setAttendance(initialState)
  }, [session])

  const updateAttendance = (
    employeeName: string,
    field: keyof AttendanceState,
    value: string | boolean | number
  ) => {
    setAttendance(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(employeeName) || { status: '', late_start: false, late_break_count: 0, notes: '' }
      
      if (field === 'status') {
        // If changing to absence, reset late fields
        const newStatus = value as AttendanceStatus | ''
        if (newStatus === 'absent_planned' || newStatus === 'absent_unplanned') {
          newMap.set(employeeName, { 
            ...current, 
            status: newStatus, 
            late_start: false,
            late_break_count: 0
          })
        } else {
          newMap.set(employeeName, { ...current, status: newStatus })
        }
      } else if (field === 'late_start') {
        newMap.set(employeeName, { ...current, late_start: value as boolean })
      } else if (field === 'late_break_count') {
        newMap.set(employeeName, { ...current, late_break_count: value as number })
      } else {
        newMap.set(employeeName, { ...current, notes: value as string })
      }
      
      return newMap
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Only save entries that have a status set
      const entries = Array.from(attendance.entries())
        .filter(([, state]) => state.status !== '')
        .map(([employeeName, state]) => ({
          session_id: session.id,
          employee_name: employeeName,
          status: state.status,
          late_start: state.status === 'present' ? state.late_start : false,
          late_break_count: state.status === 'present' ? state.late_break_count : 0,
          notes: state.notes || undefined,
        }))

      if (entries.length === 0) {
        setError('Vyberte alespoň jeden záznam k uložení')
        setSaving(false)
        return
      }

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

  const getExistingRecord = (employeeName: string): AttendanceRecord | undefined => {
    return session.attendance_records?.find(r => r.employee_name === employeeName)
  }

  return (
    <div className="h-full flex flex-col bg-background border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b shrink-0 bg-card">
        <div>
          <h2 className="text-lg font-semibold">{session.title}</h2>
          <p className="text-sm text-muted-foreground">
            {formatSessionType(session.type)} • {formatDate(session.date)}
            <br />
            {formatTime(session.start_time)} - {formatTime(session.end_time)}
          </p>
          {session.google_deleted && (
            <Badge variant="destructive" className="mt-2">
              Smazáno z Google Calendar
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {TEAM_MEMBERS.map(member => {
          const fullName = getFullName(member)
          const state = attendance.get(fullName) || { status: '', late_start: false, late_break_count: 0, notes: '' }
          const existingRecord = getExistingRecord(fullName)
          
          // Build late status string
          const getLateLabel = (record: AttendanceRecord): string => {
            const parts: string[] = []
            if (record.late_start) parts.push('pozdě start')
            if (record.late_break_count > 0) parts.push(`pozdě po přestávce (${record.late_break_count}×)`)
            return parts.length > 0 ? ` - ${parts.join(', ')}` : ''
          }

          return (
            <div
              key={fullName}
              className="border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <Label className="font-medium text-sm">{fullName}</Label>
                {existingRecord && (
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${getAttendanceStatusColor(existingRecord.status)}`}
                  >
                    {formatAttendanceStatus(existingRecord.status)}
                    {getLateLabel(existingRecord)}
                  </Badge>
                )}
              </div>

              {isLoggedIn ? (
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={state.status}
                    onValueChange={(v) => updateAttendance(fullName, 'status', v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {state.status === 'present' && (
                    <div className="flex gap-2 items-center">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={state.late_start}
                          onChange={(e) => updateAttendance(fullName, 'late_start', e.target.checked)}
                          className="h-4 w-4"
                        />
                        Pozdě start
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        Přestávky:
                        <input
                          type="number"
                          min={0}
                          value={state.late_break_count}
                          onChange={(e) => updateAttendance(fullName, 'late_break_count', parseInt(e.target.value) || 0)}
                          className="w-12 h-6 text-center border rounded"
                        />
                      </label>
                    </div>
                  )}

                  {state.status && (
                    <Textarea
                      placeholder="Poznámky"
                      value={state.notes}
                      onChange={(e) => updateAttendance(fullName, 'notes', e.target.value)}
                      className="col-span-2 text-sm min-h-[60px]"
                      rows={2}
                    />
                  )}
                </div>
              ) : (
                !existingRecord && (
                  <p className="text-xs text-muted-foreground">
                    Přihlaste se pro úpravu
                  </p>
                )
              )}
            </div>
          )
        })}

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      {isLoggedIn && (
        <div className="p-4 border-t shrink-0">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ukládám...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Uložit docházku
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
