"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserHoursTreemap, type UserProjectHours } from "@/components/UserHoursTreemap"
import { ThemeToggle } from "@/components/theme-toggle"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

const CZECH_MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
]

interface WeekOption {
  value: string
  label: string
  from: string
  to: string
  isIncomplete: boolean
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getSunday(monday: Date): Date {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return sunday
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

function generateWeekOptions(weeksCount: number = 8): WeekOption[] {
  const options: WeekOption[] = []
  const today = new Date()
  const currentMonday = getMonday(today)
  
  for (let i = 0; i < weeksCount; i++) {
    const weekMonday = new Date(currentMonday)
    weekMonday.setDate(currentMonday.getDate() - (i * 7))
    
    const weekSunday = getSunday(weekMonday)
    const isCurrentWeek = i === 0
    const actualEndDate = isCurrentWeek && today < weekSunday ? today : weekSunday
    
    const monthName = CZECH_MONTHS[weekMonday.getMonth()]
    const weekNumber = Math.ceil(weekMonday.getDate() / 7)
    
    const label = `${monthName} - Týden ${weekNumber} (${formatDate(weekMonday)} - ${formatDate(actualEndDate)})${isCurrentWeek ? ' (probíhá)' : ''}`
    
    options.push({
      value: `${formatDateISO(weekMonday)}_${formatDateISO(actualEndDate)}`,
      label,
      from: formatDateISO(weekMonday),
      to: formatDateISO(actualEndDate),
      isIncomplete: isCurrentWeek
    })
  }
  
  return options
}

export default function UserHoursPage() {
  const weekOptions = generateWeekOptions(8)
  const defaultWeek = weekOptions[0]
  
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek.value)
  const [from, setFrom] = useState(defaultWeek.from)
  const [to, setTo] = useState(defaultWeek.to)
  const [data, setData] = useState<UserProjectHours[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlight40Hours, setHighlight40Hours] = useState(false)

  const handleWeekChange = (weekValue: string) => {
    setSelectedWeek(weekValue)
    const week = weekOptions.find(w => w.value === weekValue)
    if (week) {
      setFrom(week.from)
      setTo(week.to)
      handleFetch(week.from, week.to)
    }
  }

  const handleFetch = useCallback(async (fromDate: string, toDate: string) => {
    if (!fromDate || !toDate) {
      setError("Vyber prosím obě data")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clockify/users?from=${fromDate}&to=${toDate}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
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

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Hodiny podle uživatelů</h1>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <label htmlFor="week-selector" className="text-sm text-muted-foreground whitespace-nowrap">Týden</label>
            <Select value={selectedWeek} onValueChange={handleWeekChange}>
              <SelectTrigger id="week-selector" className="flex-1 sm:w-[320px] h-10 sm:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((week) => (
                  <SelectItem key={week.value} value={week.value}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Switch
              id="highlight-40"
              checked={highlight40Hours}
              onCheckedChange={setHighlight40Hours}
            />
            <Label htmlFor="highlight-40" className="text-sm cursor-pointer">
              Zvýraznit &lt;40 hodin
            </Label>
          </div>
          {error && <span className="text-sm text-red-500 w-full sm:w-auto">{error}</span>}
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Odpracované hodiny</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {loading ? (
              <div className="flex items-center justify-center h-[300px] sm:h-[500px] text-muted-foreground">
                Načítám data...
              </div>
            ) : data.length > 0 ? (
              <UserHoursTreemap data={data} dateRange={{ from, to }} highlight40Hours={highlight40Hours} />
            ) : (
              <div className="flex items-center justify-center h-[300px] sm:h-[500px] text-muted-foreground text-center px-4">
                Žádná data pro vybraný týden
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
