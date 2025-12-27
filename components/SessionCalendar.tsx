'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SessionWithAttendance } from '@/types/session'
import { getSessionTypeColor, formatTime, getSessionTypeAbbreviation } from '@/utils/attendance-helpers'
import { cn } from '@/lib/utils'

interface SessionCalendarProps {
  sessions: SessionWithAttendance[]
  onSessionClick: (session: SessionWithAttendance) => void
  selectedSessionId?: string
}

const DAYS_OF_WEEK = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export default function SessionCalendar({
  sessions,
  onSessionClick,
  selectedSessionId,
}: SessionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const { year, month, daysInMonth, firstDayOfMonth, weeks } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // Get day of week (0 = Sunday, adjust to Monday = 0)
    let firstDayOfMonth = firstDay.getDay() - 1
    if (firstDayOfMonth < 0) firstDayOfMonth = 6

    // Create weeks array
    const weeks: (number | null)[][] = []
    let currentWeek: (number | null)[] = []
    
    // Add empty days before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      currentWeek.push(null)
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    
    // Add remaining empty days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }

    return { year, month, daysInMonth, firstDayOfMonth, weeks }
  }, [currentDate])

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionWithAttendance[]>()
    sessions.forEach(session => {
      const existing = map.get(session.date) || []
      existing.push(session)
      map.set(session.date, existing)
    })
    return map
  }, [sessions])

  const navigateMonth = (delta: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + delta)
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
  }

  const getDateString = (day: number) => {
    // Use local date formatting to avoid UTC conversion issues
    const y = year
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="capitalize text-base sm:text-xl">{formatMonthYear(currentDate)}</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={goToToday} className="hidden sm:flex">
              Dnes
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {/* Day headers */}
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-1 sm:py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (day === null) {
                return <div key={`empty-${weekIndex}-${dayIndex}`} className="min-h-14 sm:min-h-24" />
              }

              const dateString = getDateString(day)
              const daySessions = sessionsByDate.get(dateString) || []
              const todayClass = isToday(day) ? 'ring-2 ring-primary' : ''

              return (
                <div
                  key={dateString}
                  className={cn(
                    'min-h-14 sm:min-h-24 border rounded-md p-0.5 sm:p-1 bg-card',
                    todayClass
                  )}
                >
                  <div className="text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-center sm:text-left">{day}</div>
                  
                  {/* Mobile: Show compact dots/pills */}
                  <div className="flex flex-wrap gap-0.5 justify-center sm:hidden">
                    {daySessions.map(session => {
                      const hasAttendance = session.attendance_records?.length > 0
                      const isSelected = session.id === selectedSessionId
                      
                      return (
                        <button
                          key={session.id}
                          onClick={() => onSessionClick(session)}
                          className={cn(
                            'w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors',
                            getSessionTypeColor(session.type),
                            'text-white hover:opacity-90',
                            isSelected && 'ring-2 ring-offset-1 ring-primary',
                            session.google_deleted && 'opacity-50'
                          )}
                          title={`${session.title} - ${formatTime(session.start_time)}`}
                        >
                          {getSessionTypeAbbreviation(session.type)}
                          {hasAttendance && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  
                  {/* Desktop: Show full cards */}
                  <div className="hidden sm:block space-y-1">
                    {daySessions.map(session => {
                      const hasAttendance = session.attendance_records?.length > 0
                      const isSelected = session.id === selectedSessionId
                      
                      return (
                        <button
                          key={session.id}
                          onClick={() => onSessionClick(session)}
                          className={cn(
                            'w-full text-left text-xs p-1 rounded transition-colors',
                            getSessionTypeColor(session.type),
                            'text-white hover:opacity-90',
                            isSelected && 'ring-2 ring-offset-1 ring-primary',
                            session.google_deleted && 'opacity-50 line-through'
                          )}
                        >
                          <div className="font-medium truncate">
                            {formatTime(session.start_time)}
                          </div>
                          <div className="truncate">{session.title}</div>
                          {hasAttendance && (
                            <Badge variant="secondary" className="mt-0.5 text-[10px] px-1 py-0">
                              {session.attendance_records.length} záznamů
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>TS</span>
            <span className="hidden sm:inline">Training Session</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>TM</span>
            <span className="hidden sm:inline">Team Meeting</span>
            <span>Team Meeting</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
