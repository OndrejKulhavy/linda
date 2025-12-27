'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { SessionWithAttendance, AttendanceStatus, LateType, AttendanceRecord } from '@/types/session'
import { TEAM_MEMBERS, getFullName } from '@/lib/team-members'
import {
  formatSessionType,
  formatDate,
  formatTime,
  getAttendanceStatusColor,
  formatAttendanceStatus,
  formatLateType,
} from '@/utils/attendance-helpers'

interface SessionAttendancePanelProps {
  session: SessionWithAttendance
  onClose: () => void
  onSave: () => void
  isLoggedIn: boolean
}

interface AttendanceState {
  status: AttendanceStatus | ''
  late_type: LateType | ''
  notes: string
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Přítomen/a' },
  { value: 'late', label: 'Pozdě' },
  { value: 'absent_planned', label: 'Absence (plánovaná)' },
  { value: 'absent_unplanned', label: 'Absence (neplánovaná)' },
]

const LATE_TYPE_OPTIONS: { value: LateType; label: string }[] = [
  { value: 'start', label: 'Pozdě na začátek' },
  { value: 'after_break', label: 'Pozdě po přestávce' },
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
        late_type: record.late_type || '',
        notes: record.notes || '',
      })
    })

    setAttendance(initialState)
  }, [session])

  const updateAttendance = (
    employeeName: string,
    field: keyof AttendanceState,
    value: string
  ) => {
    setAttendance(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(employeeName) || { status: '', late_type: '', notes: '' }
      
      // If changing status away from 'late', clear late_type
      if (field === 'status' && value !== 'late') {
        newMap.set(employeeName, { 
          ...current, 
          status: value as AttendanceStatus | '', 
          late_type: '' 
        })
      } else if (field === 'status') {
        newMap.set(employeeName, { ...current, status: value as AttendanceStatus | '' })
      } else if (field === 'late_type') {
        newMap.set(employeeName, { ...current, late_type: value as LateType | '' })
      } else {
        newMap.set(employeeName, { ...current, notes: value })
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
          late_type: state.status === 'late' ? state.late_type || undefined : undefined,
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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{session.title}</CardTitle>
            <CardDescription>
              {formatSessionType(session.type)} • {formatDate(session.date)}
              <br />
              {formatTime(session.start_time)} - {formatTime(session.end_time)}
            </CardDescription>
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
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
        {TEAM_MEMBERS.map(member => {
          const fullName = getFullName(member)
          const state = attendance.get(fullName) || { status: '', late_type: '', notes: '' }
          const existingRecord = getExistingRecord(fullName)

          return (
            <div
              key={fullName}
              className="border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label className="font-medium">{fullName}</Label>
                {existingRecord && (
                  <Badge
                    variant="outline"
                    className={getAttendanceStatusColor(existingRecord.status)}
                  >
                    {formatAttendanceStatus(existingRecord.status)}
                    {existingRecord.late_type && ` (${formatLateType(existingRecord.late_type)})`}
                  </Badge>
                )}
              </div>

              {isLoggedIn ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select
                    value={state.status}
                    onValueChange={(v) => updateAttendance(fullName, 'status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {state.status === 'late' && (
                    <Select
                      value={state.late_type}
                      onValueChange={(v) => updateAttendance(fullName, 'late_type', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Typ zpoždění" />
                      </SelectTrigger>
                      <SelectContent>
                        {LATE_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {state.status && (
                    <Textarea
                      placeholder="Poznámky (volitelné)"
                      value={state.notes}
                      onChange={(e) => updateAttendance(fullName, 'notes', e.target.value)}
                      className="col-span-full text-sm"
                      rows={2}
                    />
                  )}
                </div>
              ) : (
                !existingRecord && (
                  <p className="text-sm text-muted-foreground">
                    Přihlaste se pro úpravu docházky
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

        {isLoggedIn && (
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
        )}
      </CardContent>
    </Card>
  )
}
