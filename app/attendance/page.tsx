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
  Coffee,
  XCircle,
  Calendar,
  Users,
  AlertTriangle,
  Check,
} from 'lucide-react'
import type { SessionWithAttendance, AttendanceRecord } from '@/types/session'
import { TEAM_MEMBERS, getFullName } from '@/lib/team-members'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface MemberStats {
  name: string
  present: number
  lateStart: number
  lateAfterBreak: number
  absentPlanned: number
  absentUnplanned: number
  totalSessions: number
  attendanceRate: number
  issueCount: number
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
    })
  }, [sessions, selectedMonth])

  // Calculate member statistics
  const memberStats = useMemo((): MemberStats[] => {
    const statsMap = new Map<string, MemberStats>()
    
    // Initialize all members
    TEAM_MEMBERS.forEach(member => {
      const fullName = getFullName(member)
      statsMap.set(fullName, {
        name: fullName,
        present: 0,
        lateStart: 0,
        lateAfterBreak: 0,
        absentPlanned: 0,
        absentUnplanned: 0,
        totalSessions: filteredSessions.length,
        attendanceRate: 0,
        issueCount: 0,
      })
    })
    
    // Count records
    filteredSessions.forEach(session => {
      session.attendance_records?.forEach((record: AttendanceRecord) => {
        const stats = statsMap.get(record.employee_name)
        if (stats) {
          switch (record.status) {
            case 'present':
              stats.present++
              // Track late arrivals from the new fields
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
    
    // Calculate rates
    const result = Array.from(statsMap.values())
    result.forEach(stats => {
      const attended = stats.present // Present already includes people who were late
      stats.attendanceRate = stats.totalSessions > 0 
        ? Math.round((attended / stats.totalSessions) * 100) 
        : 0
      stats.issueCount = stats.lateStart + stats.lateAfterBreak + stats.absentUnplanned
    })
    
    return result.sort((a, b) => b.issueCount - a.issueCount)
  }, [filteredSessions])

  // Overview stats
  const overviewStats = useMemo(() => {
    const totalSessions = filteredSessions.length
    const sessionsWithRecords = filteredSessions.filter(s => s.attendance_records?.length > 0).length
    
    let totalPresent = 0
    let totalLate = 0
    let totalAbsentPlanned = 0
    let totalAbsentUnplanned = 0
    
    filteredSessions.forEach(session => {
      session.attendance_records?.forEach((record: AttendanceRecord) => {
        switch (record.status) {
          case 'present': 
            totalPresent++
            // Count late instances from new fields
            if (record.late_start) totalLate++
            totalLate += record.late_break_count ?? 0
            break
          case 'absent_planned': totalAbsentPlanned++; break
          case 'absent_unplanned': totalAbsentUnplanned++; break
        }
      })
    })
    
    const totalRecords = totalPresent + totalLate + totalAbsentPlanned + totalAbsentUnplanned
    
    return {
      totalSessions,
      sessionsWithRecords,
      totalPresent,
      totalLate,
      totalAbsentPlanned,
      totalAbsentUnplanned,
      totalRecords,
      presentRate: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0,
    }
  }, [filteredSessions])

  // Chart data for late arrivals by member
  const lateChartData = useMemo(() => {
    return memberStats
      .filter(m => m.lateStart + m.lateAfterBreak > 0)
      .map(m => ({
        name: m.name.split(' ')[0], // First name only
        fullName: m.name,
        lateStart: m.lateStart,
        lateAfterBreak: m.lateAfterBreak,
        total: m.lateStart + m.lateAfterBreak,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [memberStats])

  // Pie chart data
  const pieChartData = useMemo(() => [
    { name: 'Přítomni', value: overviewStats.totalPresent, color: '#22c55e' },
    { name: 'Pozdě', value: overviewStats.totalLate, color: '#f59e0b' },
    { name: 'Plán. absence', value: overviewStats.totalAbsentPlanned, color: '#3b82f6' },
    { name: 'Nepl. absence', value: overviewStats.totalAbsentUnplanned, color: '#ef4444' },
  ].filter(d => d.value > 0), [overviewStats])

  const chartConfig = {
    lateStart: {
      label: 'Pozdě na začátek',
      color: 'hsl(35 92% 50%)',
    },
    lateAfterBreak: {
      label: 'Pozdě po přestávce',
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
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Kalendář</span>
              </Button>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold">Statistiky docházky</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vyberte měsíc" />
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
                Žádné sessions v tomto měsíci.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Sessions</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {overviewStats.sessionsWithRecords}/{overviewStats.totalSessions}
                  </div>
                  <p className="text-xs text-muted-foreground">se záznamy</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Účast</span>
                  </div>
                  <div className="text-2xl font-bold mt-2 text-green-600 dark:text-green-400">
                    {overviewStats.presentRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">{overviewStats.totalPresent} přítomných</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-muted-foreground">Pozdě</span>
                  </div>
                  <div className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">
                    {overviewStats.totalLate}
                  </div>
                  <p className="text-xs text-muted-foreground">pozdních příchodů</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Absence</span>
                  </div>
                  <div className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">
                    {overviewStats.totalAbsentUnplanned}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    neplánovaných ({overviewStats.totalAbsentPlanned} plán.)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Late Arrivals Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Pozdní příchody
                  </CardTitle>
                  <CardDescription>
                    Podle člena týmu za vybraný měsíc
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lateChartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-center">
                      <Check className="w-10 h-10 text-green-500 mb-2" />
                      <p className="text-muted-foreground">Žádné pozdní příchody! 🎉</p>
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[250px]">
                      <BarChart data={lateChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="lateStart" stackId="a" fill="var(--color-lateStart)" name="Na začátek" />
                        <Bar dataKey="lateAfterBreak" stackId="a" fill="var(--color-lateAfterBreak)" name="Po přestávce" />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Distribution Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Rozdělení docházky
                  </CardTitle>
                  <CardDescription>
                    Celkové zastoupení statusů
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewStats.totalRecords === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-center">
                      <AlertTriangle className="w-10 h-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">Žádné záznamy</p>
                    </div>
                  ) : (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Member Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Přehled členů týmu
                </CardTitle>
                <CardDescription>
                  Seřazeno podle počtu problémů (pozdě + neplánované absence)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium">Jméno</th>
                        <th className="text-center py-2 px-2 font-medium">
                          <span className="hidden sm:inline">Přítomen</span>
                          <Check className="sm:hidden w-4 h-4 mx-auto text-green-500" />
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <span className="hidden sm:inline">Pozdě Z</span>
                          <Clock className="sm:hidden w-4 h-4 mx-auto text-amber-500" />
                        </th>
                        <th className="text-center py-2 px-2 font-medium">
                          <span className="hidden sm:inline">Pozdě P</span>
                          <Coffee className="sm:hidden w-4 h-4 mx-auto text-orange-500" />
                        </th>
                        <th className="text-center py-2 px-2 font-medium hidden sm:table-cell">Plán. abs.</th>
                        <th className="text-center py-2 px-2 font-medium">
                          <span className="hidden sm:inline">Nepl. abs.</span>
                          <XCircle className="sm:hidden w-4 h-4 mx-auto text-red-500" />
                        </th>
                        <th className="text-center py-2 px-2 font-medium">Problémy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberStats.map((member) => (
                        <tr
                          key={member.name}
                          className={cn(
                            'border-b last:border-0',
                            member.issueCount > 0 && 'bg-amber-50/50 dark:bg-amber-950/20'
                          )}
                        >
                          <td className="py-2 px-2 font-medium">
                            {member.name.split(' ')[0]}
                            <span className="hidden sm:inline"> {member.name.split(' ').slice(1).join(' ')}</span>
                          </td>
                          <td className="text-center py-2 px-2 text-green-600 dark:text-green-400">
                            {member.present}
                          </td>
                          <td className="text-center py-2 px-2 text-amber-600 dark:text-amber-400">
                            {member.lateStart || '-'}
                          </td>
                          <td className="text-center py-2 px-2 text-orange-600 dark:text-orange-400">
                            {member.lateAfterBreak || '-'}
                          </td>
                          <td className="text-center py-2 px-2 text-blue-600 dark:text-blue-400 hidden sm:table-cell">
                            {member.absentPlanned || '-'}
                          </td>
                          <td className="text-center py-2 px-2 text-red-600 dark:text-red-400">
                            {member.absentUnplanned || '-'}
                          </td>
                          <td className="text-center py-2 px-2">
                            {member.issueCount > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                {member.issueCount}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                0
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
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
