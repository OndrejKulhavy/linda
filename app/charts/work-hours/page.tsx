"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkHoursChart, type WorkHoursData } from "@/components/WorkHoursChart"
import { ThemeToggle } from "@/components/theme-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

const CZECH_MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
]

interface MonthOption {
  value: string
  label: string
  year: number
  month: number
}

function generateMonthOptions(monthsCount: number = 12): MonthOption[] {
  const options: MonthOption[] = []
  const today = new Date()
  
  for (let i = 0; i < monthsCount; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()
    
    options.push({
      value: `${year}-${(month + 1).toString().padStart(2, '0')}`,
      label: `${CZECH_MONTHS[month]} ${year}`,
      year,
      month
    })
  }
  
  return options
}

function getDateRangeFromMonths(fromMonth: string, toMonth: string): { from: string; to: string } {
  const [fromYear, fromMonthStr] = fromMonth.split("-")
  const [toYear, toMonthStr] = toMonth.split("-")
  
  const fromDate = new Date(parseInt(fromYear), parseInt(fromMonthStr) - 1, 1)
  const toDate = new Date(parseInt(toYear), parseInt(toMonthStr), 0)
  
  return {
    from: fromDate.toISOString().split("T")[0],
    to: toDate.toISOString().split("T")[0]
  }
}

function getWeekNumber(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getFullYear()}-W${weekNo}`
}

function getWeekDateRange(weekStr: string): { start: Date; end: Date } {
  const [year, weekPart] = weekStr.split("-W")
  const weekNum = parseInt(weekPart, 10)
  
  const jan4 = new Date(parseInt(year, 10), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  
  const start = new Date(startOfWeek1)
  start.setDate(startOfWeek1.getDate() + (weekNum - 1) * 7)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  
  return { start, end }
}

function formatWeekLabel(weekStr: string): string {
  const { start, end } = getWeekDateRange(weekStr)
  const formatDate = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`
  return `${formatDate(start)} - ${formatDate(end)}`
}

function getWeeksInRange(from: string, to: string): string[] {
  const weeks = new Set<string>()
  const current = new Date(from)
  const end = new Date(to)
  
  while (current <= end) {
    weeks.add(getWeekNumber(current))
    current.setDate(current.getDate() + 1)
  }
  
  return Array.from(weeks).sort()
}

export default function WorkHoursPage() {
  const monthOptions = generateMonthOptions(12)
  const currentMonth = monthOptions[0]
  
  const [fromMonth, setFromMonth] = useState(currentMonth.value)
  const [toMonth, setToMonth] = useState(currentMonth.value)
  const [data, setData] = useState<WorkHoursData[]>([])
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weeklyGoalPerUser = 40
  const weeklyGoal = userCount * weeklyGoalPerUser

  const totalHours = data.reduce((sum, d) => sum + d.hours, 0)
  const totalGoal = data.length * weeklyGoal

  const handleMonthChange = (newFromMonth: string, newToMonth: string) => {
    setFromMonth(newFromMonth)
    setToMonth(newToMonth)
    
    const { from, to } = getDateRangeFromMonths(newFromMonth, newToMonth)
    handleFetch(from, to)
  }

  const handleFetch = useCallback(async (fromDate: string, toDate: string) => {
    if (!fromDate || !toDate) {
      setError("Vyber prosím obě data")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clockify/total?from=${fromDate}&to=${toDate}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      setUserCount(result.userCount)

      const weeklyHours = new Map<string, number>()
      
      for (const entry of result.data) {
        const week = getWeekNumber(new Date(entry.date))
        weeklyHours.set(week, (weeklyHours.get(week) || 0) + entry.hours)
      }

      const weeks = getWeeksInRange(fromDate, toDate)
      const chartData: WorkHoursData[] = weeks.map((week) => ({
        date: week,
        weekLabel: formatWeekLabel(week),
        hours: Math.round((weeklyHours.get(week) || 0) * 100) / 100,
        goal: result.userCount * weeklyGoalPerUser,
      }))

      setData(chartData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
    } finally {
      setLoading(false)
    }
  }, [weeklyGoalPerUser])

  useEffect(() => {
    const { from, to } = getDateRangeFromMonths(fromMonth, toMonth)
    handleFetch(from, to)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zpět
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Odpracované hodiny</h1>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <label htmlFor="from-month-selector" className="text-sm text-muted-foreground whitespace-nowrap">Od</label>
            <Select 
              value={fromMonth} 
              onValueChange={(value) => handleMonthChange(value, toMonth)}
            >
              <SelectTrigger id="from-month-selector" className="w-full sm:w-[180px] h-10 sm:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="to-month-selector" className="text-sm text-muted-foreground whitespace-nowrap">Do</label>
            <Select 
              value={toMonth} 
              onValueChange={(value) => handleMonthChange(fromMonth, value)}
            >
              <SelectTrigger id="to-month-selector" className="w-full sm:w-[180px] h-10 sm:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <span className="text-sm text-red-500 w-full sm:w-auto">{error}</span>}
          {userCount > 0 && (
            <span className="text-sm text-muted-foreground w-full sm:w-auto sm:ml-auto text-center sm:text-right">
              {userCount} uživatelů · cíl {weeklyGoal}h/týden
            </span>
          )}
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Graf odpracovaných hodin</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {loading ? (
              <div className="flex items-center justify-center h-[300px] sm:h-[400px] text-muted-foreground">
                Načítám data...
              </div>
            ) : data.length > 0 ? (
              <WorkHoursChart data={data} totalHours={totalHours} totalGoal={totalGoal} />
            ) : (
              <div className="flex items-center justify-center h-[300px] sm:h-[400px] text-muted-foreground text-center px-4">
                Žádná data pro vybrané měsíce
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
