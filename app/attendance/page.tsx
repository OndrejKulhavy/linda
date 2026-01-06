'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  ArrowLeft,
  Loader2,
  Clock,
  XCircle,
  Calendar,
  Users,
  Check,
} from 'lucide-react'
import type { SessionWithAttendance, AttendanceRecord } from '@/types/session'
import { TEAM_MEMBERS, getFullName } from '@/lib/team-members'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'
import { cn } from '@/lib/utils'

interface MemberStats {
  name: string
  firstName: string
  present: number
  lateStart: number
  lateAfterBreak: number
  absentPlanned: number
  absentUnplanned: number
  totalSessions: number
  attendanceRate: number
  totalLate: number
}

interface MonthOption {
  value: string
  label: string
  year: number
  month: number
}

function getMonthOptions(): MonthOption[] {
  const options: MonthOption[] = []
  const now = new Date()
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' }),
      year: date.getFullYear(),
      month: date.getMonth(),
    })
  }
  
  return options
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<SessionWithAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const monthOptions = useMemo(() => getMonthOptions(), [])

  useEffect(() => {
    if (monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[0].value)
    }
  }, [monthOptions, selectedMonth])

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/sessions')
        const data = await response.json()
        setSessions(data.sessions || [])
      } catch {
        console.error('Failed to fetch sessions')
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  // Filter sessions by selected month
  const filteredSessions = useMemo(() => {
    if (!selectedMonth) return []
    const [year, month] = selectedMonth.split('-').map(Number)
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.date)
      return sessionDate.getFullYear() === year && sessionDate.getMonth() === month - 1
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [sessions, selectedMonth])

  // Filter out future sessions for statistics (only count sessions that have already happened)
  const pastSessions = useMemo(() => {
    return filteredSessions.filter(session => !isSessionInFuture(session.date))
  }, [filteredSessions])

  // Calculate member statistics
  const memberStats = useMemo((): MemberStats[] => {
    const statsMap = new Map<string, MemberStats>()
    
    // Initialize all members
    TEAM_MEMBERS.forEach(member => {
      const fullName = getFullName(member)
      statsMap.set(fullName, {
        name: fullName,
        firstName: member.firstName,
        present: 0,
        lateStart: 0,
        lateAfterBreak: 0,
        absentPlanned: 0,
        absentUnplanned: 0,
        totalSessions: pastSessions.length,
        attendanceRate: 0,
        totalLate: 0,
      })
    })
    
    // Count records - only absences and late arrivals create records
    // No record = person was present and on time
    pastSessions.forEach(session => {
      session.attendance_records?.forEach((record: AttendanceRecord) => {
        const stats = statsMap.get(record.employee_name)
        if (stats) {
          switch (record.status) {
            case 'present':
              // Record exists with 'present' = was late (tracked separately)
              if (record.late_start) stats.lateStart++
              stats.lateAfterBreak += record.late_break_count ?? 0
              break
            case 'absent_planned':
              stats.absentPlanned++
              break
            case 'absent_unplanned':
              stats.absentUnplanned++
              break
          }
        }
      })
    })
    
    // Calculate rates - present = total sessions minus absences
    const result = Array.from(statsMap.values())
    result.forEach(stats => {
      stats.totalLate = stats.lateStart + stats.lateAfterBreak
      const totalAbsent = stats.absentPlanned + stats.absentUnplanned
      stats.present = stats.totalSessions - totalAbsent
      stats.attendanceRate = stats.totalSessions > 0 
        ? Math.round((stats.present / stats.totalSessions) * 100) 
        : 0
    })
    
    return result.sort((a, b) => a.name.localeCompare(b.name, 'cs'))
  }, [pastSessions])

  // Overview stats
  const overviewStats = useMemo(() => {
    const totalSessions = pastSessions.length
    const sessionsWithRecords = pastSessions.filter(s => s.attendance_records?.length > 0).length
    const teamSize = TEAM_MEMBERS.length
    
    let totalLateInstances = 0
    let totalAbsentPlanned = 0
    let totalAbsentUnplanned = 0
    
    // Count only absences and late instances from records
    pastSessions.forEach(session => {
      session.attendance_records?.forEach((record: AttendanceRecord) => {
        switch (record.status) {
          case 'present': 
            // Person was present but late
            if (record.late_start) totalLateInstances++
            totalLateInstances += record.late_break_count ?? 0
            break
          case 'absent_planned': totalAbsentPlanned++; break
          case 'absent_unplanned': totalAbsentUnplanned++; break
        }
      })
    })
    
    // Present = expected attendance minus absences
    const expectedRecords = totalSessions * teamSize
    const totalAbsent = totalAbsentPlanned + totalAbsentUnplanned
    const totalPresent = expectedRecords - totalAbsent
    const attendanceRate = expectedRecords > 0 
      ? Math.round((totalPresent / expectedRecords) * 100) 
      : 0
    
    return {
      totalSessions,
      sessionsWithRecords,
      teamSize,
      totalPresent,
      totalLateInstances,
      totalAbsentPlanned,
      totalAbsentUnplanned,
      attendanceRate,
    }
  }, [pastSessions])

  // Attendance data per event (each session is a point, TM and TS separate)
  const attendanceData = useMemo(() => {
    const teamSize = TEAM_MEMBERS.length
    
    return pastSessions.map(session => {
      const records = session.attendance_records || []
      const date = new Date(session.date)
      const isTM = session.type === 'team_meeting'
      const typeLabel = isTM ? 'TM' : 'TS'
      
      // Count absences
      let totalAbsent = 0
      records.forEach(r => {
        if (r.status === 'absent_planned' || r.status === 'absent_unplanned') {
          totalAbsent++
        }
      })
      
      // Present = team size - absences
      const present = teamSize - totalAbsent
      const attendanceRate = teamSize > 0 ? Math.round((present / teamSize) * 100) : 100
      
      return {
        label: `${date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}`,
        fullLabel: `${typeLabel} ${date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}`,
        fullDate: session.date,
        type: session.type,
        typeLabel,
        isTM,
        present,
        absent: totalAbsent,
        teamSize,
        attendanceRate,
      }
    })
  }, [pastSessions])

  // Late arrivals data per event
  const lateData = useMemo(() => {
    return pastSessions.map(session => {
      const records = session.attendance_records || []
      const date = new Date(session.date)
      const isTM = session.type === 'team_meeting'
      const typeLabel = isTM ? 'TM' : 'TS'
      
      // Count late instances
      let totalLate = 0
      records.forEach(r => {
        if (r.status === 'present') {
          if (r.late_start) totalLate++
          totalLate += r.late_break_count ?? 0
        }
      })
      
      return {
        label: `${typeLabel} ${date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}`,
        fullDate: session.date,
        type: session.type,
        typeLabel,
        totalLate,
      }
    })
  }, [pastSessions])

  // Top late arrivals (people with most lates)
  const topLateArrivals = useMemo(() => {
    return memberStats
      .filter(m => m.totalLate > 0)
      .sort((a, b) => b.totalLate - a.totalLate)
      .slice(0, 5)
  }, [memberStats])

  const chartConfig = {
    // Attendance stacked bar
    present: {
      label: 'Přítomni',
      color: 'hsl(142 76% 36%)', // green
    },
    absent: {
      label: 'Absence',
      color: 'hsl(0 84% 60%)', // red
    },
    // Late arrivals
    totalLate: {
      label: 'Pozdě',
      color: 'hsl(35 92% 50%)', // amber
    },
    // For member chart
    lateStart: {
      label: 'Pozdě začátek',
      color: 'hsl(35 92% 50%)',
    },
    lateAfterBreak: {
      label: 'Pozdě přestávka',
      color: 'hsl(25 95% 53%)',
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Kalendář</span>
              </Button>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold">Statistiky</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px] sm:w-[180px]">
                <SelectValue placeholder="Měsíc" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                Žádné schůzky v tomto měsíci.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Note about future sessions */}
            {filteredSessions.length > pastSessions.length && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                ℹ️ Statistiky zahrnují pouze uskutečněné schůzky ({pastSessions.length} z {filteredSessions.length}). Nadcházející schůzky jsou ze statistik vyloučeny.
              </div>
            )}
            
            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">Schůzky</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {overviewStats.totalSessions}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {overviewStats.sessionsWithRecords} se záznamy
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">Účast</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-green-600 dark:text-green-400">
                    {overviewStats.attendanceRate}%
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {overviewStats.totalPresent} přítomností
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">Pozdě</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-amber-600 dark:text-amber-400">
                    {overviewStats.totalLateInstances}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    pozdních příchodů
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">Absence</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-red-600 dark:text-red-400">
                    {overviewStats.totalAbsentUnplanned}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    neomluv. ({overviewStats.totalAbsentPlanned} omluv.)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="space-y-6">
              {/* Attendance Stacked Bar Chart - Full Width */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    Účast na schůzkách
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Každý sloupec = {TEAM_MEMBERS.length} členů týmu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                    <BarChart data={attendanceData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 10 }} 
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis 
                        domain={[0, TEAM_MEMBERS.length]} 
                        tick={{ fontSize: 10 }} 
                        tickLine={false}
                        axisLine={false}
                        width={25}
                        ticks={[0, 4, 8, 12, 16]}
                      />
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const data = payload[0]?.payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-2 text-sm">
                              <p className="font-medium">{data?.fullLabel}</p>
                              <p className="text-green-600">Přítomni: {data?.present}/{data?.teamSize}</p>
                              {data?.absent > 0 && (
                                <p className="text-red-500">Absence: {data?.absent}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                      <Bar 
                        dataKey="present" 
                        stackId="a"
                        name="Přítomni"
                        radius={[0, 0, 0, 0]}
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell 
                            key={`present-${index}`} 
                            fill={entry.isTM ? 'hsl(221, 83%, 53%)' : 'hsl(142, 76%, 36%)'}
                          />
                        ))}
                      </Bar>
                      <Bar 
                        dataKey="absent" 
                        stackId="a"
                        fill="hsl(0, 84%, 60%)"
                        name="Absence"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-blue-500" />
                      <span className="text-xs sm:text-sm text-muted-foreground">TM (Team Meeting)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-green-600" />
                      <span className="text-xs sm:text-sm text-muted-foreground">TS (Tréninková schůzka)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-red-500" />
                      <span className="text-xs sm:text-sm text-muted-foreground">Absence</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            <div className="grid lg:grid-cols-2 gap-6">

              {/* Late Arrivals Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    Pozdní příchody
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Počet pozdních příchodů na jednotlivých eventech
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lateData.every(d => d.totalLate === 0) ? (
                    <div className="flex flex-col items-center justify-center h-[200px] sm:h-[250px] text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-3">
                        <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-muted-foreground text-sm">Žádné pozdní příchody 🎉</p>
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                      <BarChart data={lateData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="label" 
                          tick={{ fontSize: 9 }} 
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }} 
                          tickLine={false}
                          axisLine={false}
                          width={20}
                          allowDecimals={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="totalLate" 
                          fill="var(--color-totalLate)" 
                          name="Pozdě"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Late Arrivals */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    Pozdní příchody
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Top 5 členů s nejvíce pozdními příchody
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topLateArrivals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] sm:h-[250px] text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-3">
                        <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-muted-foreground text-sm">Žádné pozdní příchody 🎉</p>
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                      <BarChart 
                        data={topLateArrivals} 
                        layout="vertical" 
                        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis 
                          dataKey="firstName" 
                          type="category" 
                          width={70} 
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="lateStart" 
                          stackId="a" 
                          fill="var(--color-lateStart)" 
                          name="Začátek"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar 
                          dataKey="lateAfterBreak" 
                          stackId="a" 
                          fill="var(--color-lateAfterBreak)" 
                          name="Přestávka"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            </div>

            {/* Member Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  Přehled členů
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Statistiky za {monthOptions.find(m => m.value === selectedMonth)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full text-xs sm:text-sm min-w-[400px]">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 px-2 font-medium">Jméno</th>
                        <th className="text-center py-2 px-1 sm:px-2 font-medium w-16 sm:w-auto">
                          <span className="hidden sm:inline">Účast</span>
                          <Check className="sm:hidden w-3.5 h-3.5 mx-auto" />
                        </th>
                        <th className="text-center py-2 px-1 sm:px-2 font-medium w-14 sm:w-auto">
                          <span className="hidden sm:inline">Pozdě</span>
                          <Clock className="sm:hidden w-3.5 h-3.5 mx-auto" />
                        </th>
                        <th className="text-center py-2 px-1 sm:px-2 font-medium w-14 sm:w-auto">
                          <span className="hidden sm:inline">Omluv.</span>
                          <Calendar className="sm:hidden w-3.5 h-3.5 mx-auto" />
                        </th>
                        <th className="text-center py-2 px-1 sm:px-2 font-medium w-14 sm:w-auto">
                          <span className="hidden sm:inline">Neomluv.</span>
                          <XCircle className="sm:hidden w-3.5 h-3.5 mx-auto" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberStats.map((member) => {
                        const hasIssues = member.totalLate > 0 || member.absentUnplanned > 0
                        return (
                          <tr
                            key={member.name}
                            className={cn(
                              'border-b last:border-0 transition-colors',
                              hasIssues && 'bg-amber-50/50 dark:bg-amber-950/10'
                            )}
                          >
                            <td className="py-2.5 px-2">
                              <div className="font-medium">{member.firstName}</div>
                              <div className="text-[10px] text-muted-foreground hidden sm:block">
                                {member.name.split(' ').slice(1).join(' ')}
                              </div>
                            </td>
                            <td className="text-center py-2.5 px-1 sm:px-2">
                              <span className={cn(
                                'font-medium',
                                member.attendanceRate >= 90 
                                  ? 'text-green-600 dark:text-green-400'
                                  : member.attendanceRate >= 70
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-red-600 dark:text-red-400'
                              )}>
                                {member.present}/{member.totalSessions}
                              </span>
                            </td>
                            <td className="text-center py-2.5 px-1 sm:px-2">
                              {member.totalLate > 0 ? (
                                <Badge variant="outline" className="text-[10px] sm:text-xs bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                                  {member.totalLate}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="text-center py-2.5 px-1 sm:px-2">
                              {member.absentPlanned > 0 ? (
                                <Badge variant="outline" className="text-[10px] sm:text-xs bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                                  {member.absentPlanned}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="text-center py-2.5 px-1 sm:px-2">
                              {member.absentUnplanned > 0 ? (
                                <Badge variant="outline" className="text-[10px] sm:text-xs bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                                  {member.absentUnplanned}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
