"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface WeeklyData {
  week: string
  hours: number
  reading: number
  practice: number
  training: number
}

interface UserPerformance {
  name: string
  weeklyData: WeeklyData[]
  avgHours: number
  totalHours: number
  projectDistribution: { name: string; value: number }[]
  consistency: number
}

const COLORS = {
  reading: "#10b981",
  practice: "#3b82f6",
  training: "#f59e0b",
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"]

function getLastNWeeksRange(weeks: number = 4) {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (weeks * 7))
  return {
    from: startDate.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  }
}

function getWeekNumber(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `W${weekNo}`
}

export default function PerformancePage() {
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [users, setUsers] = useState<string[]>([])
  const [performance, setPerformance] = useState<UserPerformance | null>(null)
  const [teamAverage, setTeamAverage] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weeksToShow, setWeeksToShow] = useState<number>(4)

  const fetchUsers = useCallback(async () => {
    const range = getLastNWeeksRange(weeksToShow)
    try {
      const response = await fetch(`/api/clockify/users?from=${range.from}&to=${range.to}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      const uniqueUsers = Array.from(new Set(result.data.map((d: any) => d.name))).sort()
      setUsers(uniqueUsers as string[])
      if (uniqueUsers.length > 0 && !selectedUser) {
        setSelectedUser(uniqueUsers[0] as string)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
    }
  }, [weeksToShow, selectedUser])

  const fetchPerformance = useCallback(async (userName: string) => {
    if (!userName) return

    setLoading(true)
    setError(null)

    const range = getLastNWeeksRange(weeksToShow)

    try {
      const response = await fetch(`/api/clockify/users/details?from=${range.from}&to=${range.to}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      // Filter data for selected user
      const userEntries = result.data.filter((entry: any) => entry.userName === userName)

      // Group by week and project
      const weeklyMap = new Map<string, { hours: number; reading: number; practice: number; training: number }>()
      const projectMap = new Map<string, number>()
      let totalHours = 0

      userEntries.forEach((entry: any) => {
        const week = getWeekNumber(new Date(entry.date))
        const current = weeklyMap.get(week) || { hours: 0, reading: 0, practice: 0, training: 0 }
        
        current.hours += entry.hours
        totalHours += entry.hours

        if (entry.projectName === "Reading") {
          current.reading += entry.hours
        } else if (entry.projectName === "Practice") {
          current.practice += entry.hours
        } else if (entry.projectName === "Training") {
          current.training += entry.hours
        }

        weeklyMap.set(week, current)

        const projectHours = projectMap.get(entry.projectName) || 0
        projectMap.set(entry.projectName, projectHours + entry.hours)
      })

      // Generate weekly data for all weeks in range
      const weeklyData: WeeklyData[] = []
      const current = new Date(range.from)
      const end = new Date(range.to)

      while (current <= end) {
        const week = getWeekNumber(current)
        if (!weeklyData.some(w => w.week === week)) {
          const data = weeklyMap.get(week) || { hours: 0, reading: 0, practice: 0, training: 0 }
          weeklyData.push({
            week,
            hours: Math.round(data.hours * 10) / 10,
            reading: Math.round(data.reading * 10) / 10,
            practice: Math.round(data.practice * 10) / 10,
            training: Math.round(data.training * 10) / 10,
          })
        }
        current.setDate(current.getDate() + 7)
      }

      weeklyData.sort((a, b) => {
        const weekA = parseInt(a.week.substring(1))
        const weekB = parseInt(b.week.substring(1))
        return weekA - weekB
      })

      const projectDistribution = Array.from(projectMap.entries()).map(([name, value]) => ({
        name,
        value: Math.round(value * 10) / 10,
      }))

      const avgHours = weeklyData.length > 0 ? totalHours / weeklyData.length : 0
      const consistency = weeklyData.length > 0
        ? 100 - (Math.abs(40 - avgHours) / 40) * 100
        : 0

      // Calculate team average
      const allUsers = new Map<string, number>()
      result.data.forEach((entry: any) => {
        const current = allUsers.get(entry.userName) || 0
        allUsers.set(entry.userName, current + entry.hours)
      })
      const teamTotal = Array.from(allUsers.values()).reduce((sum, h) => sum + h, 0)
      const teamAvg = allUsers.size > 0 ? teamTotal / (allUsers.size * weeklyData.length) : 0
      setTeamAverage(Math.round(teamAvg * 10) / 10)

      setPerformance({
        name: userName,
        weeklyData,
        avgHours: Math.round(avgHours * 10) / 10,
        totalHours: Math.round(totalHours * 10) / 10,
        projectDistribution,
        consistency: Math.max(0, Math.min(100, Math.round(consistency))),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
    } finally {
      setLoading(false)
    }
  }, [weeksToShow])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (selectedUser) {
      fetchPerformance(selectedUser)
    }
  }, [selectedUser, fetchPerformance])

  const getTrendIcon = (current: number, average: number) => {
    if (current > average * 1.05) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (current < average * 0.95) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-yellow-500" />
  }

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

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Individuální výkon</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <label htmlFor="user-selector" className="text-sm text-muted-foreground whitespace-nowrap">
              Člen týmu
            </label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger id="user-selector" className="flex-1 sm:w-[250px]">
                <SelectValue placeholder="Vyber člena týmu" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="weeks-selector" className="text-sm text-muted-foreground whitespace-nowrap">
              Období
            </label>
            <Select value={weeksToShow.toString()} onValueChange={(v) => setWeeksToShow(parseInt(v))}>
              <SelectTrigger id="weeks-selector" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 týdny</SelectItem>
                <SelectItem value="8">8 týdnů</SelectItem>
                <SelectItem value="12">12 týdnů</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Načítám data...
          </div>
        ) : performance ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Celkem hodin</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performance.totalHours}h</div>
                  <div className="text-xs text-muted-foreground">
                    za {weeksToShow} {weeksToShow === 1 ? 'týden' : weeksToShow < 5 ? 'týdny' : 'týdnů'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Průměr týdně</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{performance.avgHours}h</div>
                    {getTrendIcon(performance.avgHours, teamAverage)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    tým: {teamAverage}h
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Konzistence</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performance.consistency}%</div>
                  <div className="text-xs text-muted-foreground">
                    vůči 40h cíli
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Projektů</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performance.projectDistribution.length}</div>
                  <div className="text-xs text-muted-foreground">
                    aktivních projektů
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Týdenní trend hodin</CardTitle>
                <CardDescription>Odpracované hodiny po týdnech</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performance.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="week" 
                      stroke="#9ca3af"
                      tick={{ fill: "#9ca3af" }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: "#9ca3af" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#f3f4f6",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Celkem"
                      dot={{ fill: "#3b82f6", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="reading"
                      stroke={COLORS.reading}
                      strokeWidth={2}
                      name="Reading"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="practice"
                      stroke={COLORS.practice}
                      strokeWidth={2}
                      name="Practice"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="training"
                      stroke={COLORS.training}
                      strokeWidth={2}
                      name="Training"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuce projektů</CardTitle>
                  <CardDescription>Čas strávený na projektech</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={performance.projectDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {performance.projectDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekly Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Týdenní rozdělení aktivit</CardTitle>
                  <CardDescription>Porovnání Reading, Practice, Training</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={performance.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="week" 
                        stroke="#9ca3af"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        tick={{ fill: "#9ca3af" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#f3f4f6",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="reading" fill={COLORS.reading} name="Reading" />
                      <Bar dataKey="practice" fill={COLORS.practice} name="Practice" />
                      <Bar dataKey="training" fill={COLORS.training} name="Training" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Vyber člena týmu
          </div>
        )}
      </div>
    </div>
  )
}
