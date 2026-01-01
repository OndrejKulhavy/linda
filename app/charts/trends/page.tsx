"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, TrendingUp, TrendingDown, Activity } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { getWeekNumber, getLastNWeeksRange } from "@/utils/analytics"

interface WeeklyTeamData {
  week: string
  totalHours: number
  avgHoursPerPerson: number
  activeMembers: number
  goalAchievers: number
}

interface ProjectTrend {
  week: string
  [key: string]: number | string
}

export default function TrendsPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyTeamData[]>([])
  const [projectTrends, setProjectTrends] = useState<ProjectTrend[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrends = useCallback(async () => {
    setLoading(true)
    setError(null)

    const range = getLastNWeeksRange(8)

    try {
      const response = await fetch(`/api/clockify/all-users?from=${range.from}&to=${range.to}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      // Group by week
      const weeklyMap = new Map<string, Map<string, number>>()
      const projectWeeklyMap = new Map<string, Map<string, number>>()

      result.data.forEach((entry: any) => {
        const week = getWeekNumber(new Date(entry.date))
        
        // User hours per week
        if (!weeklyMap.has(week)) {
          weeklyMap.set(week, new Map())
        }
        const userHours = weeklyMap.get(week)!
        userHours.set(entry.userName, (userHours.get(entry.userName) || 0) + entry.hours)

        // Project hours per week
        if (!projectWeeklyMap.has(week)) {
          projectWeeklyMap.set(week, new Map())
        }
        const projectHours = projectWeeklyMap.get(week)!
        projectHours.set(entry.projectName, (projectHours.get(entry.projectName) || 0) + entry.hours)
      })

      // Generate weekly team data
      const teamData: WeeklyTeamData[] = []
      const current = new Date(range.from)
      const end = new Date(range.to)

      while (current <= end) {
        const week = getWeekNumber(current)
        const userHours = weeklyMap.get(week)
        
        if (userHours && userHours.size > 0) {
          const totalHours = Array.from(userHours.values()).reduce((sum, h) => sum + h, 0)
          const avgHours = totalHours / userHours.size
          const goalAchievers = Array.from(userHours.values()).filter(h => h >= 40).length

          teamData.push({
            week,
            totalHours: Math.round(totalHours * 10) / 10,
            avgHoursPerPerson: Math.round(avgHours * 10) / 10,
            activeMembers: userHours.size,
            goalAchievers,
          })
        }
        
        current.setDate(current.getDate() + 7)
      }

      teamData.sort((a, b) => {
        const weekA = parseInt(a.week.substring(1))
        const weekB = parseInt(b.week.substring(1))
        return weekA - weekB
      })

      // Generate project trends
      const allProjects = new Set<string>()
      projectWeeklyMap.forEach(projects => {
        projects.forEach((_, project) => allProjects.add(project))
      })

      const projectData: ProjectTrend[] = teamData.map(({ week }) => {
        const data: ProjectTrend = { week }
        const projects = projectWeeklyMap.get(week)
        
        allProjects.forEach(project => {
          data[project] = Math.round((projects?.get(project) || 0) * 10) / 10
        })
        
        return data
      })

      setWeeklyData(teamData)
      setProjectTrends(projectData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  const latestWeek = weeklyData[weeklyData.length - 1]
  const previousWeek = weeklyData[weeklyData.length - 2]

  const getTrend = (current: number, previous: number) => {
    if (!previous) return { icon: <Activity className="w-4 h-4" />, text: "N/A", color: "text-gray-500" }
    const change = ((current - previous) / previous) * 100
    if (change > 5) return { icon: <TrendingUp className="w-4 h-4" />, text: `+${change.toFixed(0)}%`, color: "text-green-500" }
    if (change < -5) return { icon: <TrendingDown className="w-4 h-4" />, text: `${change.toFixed(0)}%`, color: "text-red-500" }
    return { icon: <Activity className="w-4 h-4" />, text: `${change.toFixed(0)}%`, color: "text-yellow-500" }
  }

  const PROJECT_COLORS: Record<string, string> = {
    Reading: "#10b981",
    Practice: "#3b82f6",
    Training: "#f59e0b",
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

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Týmové trendy</h1>

        {error && (
          <div className="text-sm text-red-500 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Načítám data...
          </div>
        ) : weeklyData.length > 0 ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            {latestWeek && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Celkem hodin ({latestWeek.week})</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{latestWeek.totalHours}h</div>
                      {previousWeek && (
                        <div className={`flex items-center gap-1 text-sm ${getTrend(latestWeek.totalHours, previousWeek.totalHours).color}`}>
                          {getTrend(latestWeek.totalHours, previousWeek.totalHours).icon}
                          {getTrend(latestWeek.totalHours, previousWeek.totalHours).text}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Průměr na osobu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{latestWeek.avgHoursPerPerson}h</div>
                      {previousWeek && (
                        <div className={`flex items-center gap-1 text-sm ${getTrend(latestWeek.avgHoursPerPerson, previousWeek.avgHoursPerPerson).color}`}>
                          {getTrend(latestWeek.avgHoursPerPerson, previousWeek.avgHoursPerPerson).icon}
                          {getTrend(latestWeek.avgHoursPerPerson, previousWeek.avgHoursPerPerson).text}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Aktivních členů</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{latestWeek.activeMembers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Splnili 40h</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {latestWeek.goalAchievers}/{latestWeek.activeMembers}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((latestWeek.goalAchievers / latestWeek.activeMembers) * 100)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Total Hours Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Celkový týmový výkon</CardTitle>
                <CardDescription>Součet všech odpracovaných hodin po týdnech</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="totalHours"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#colorTotal)"
                      name="Celkem hodin"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Average Per Person */}
              <Card>
                <CardHeader>
                  <CardTitle>Průměrný výkon</CardTitle>
                  <CardDescription>Průměrné hodiny na osobu a počet lidí splnivších cíl</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weeklyData}>
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
                      <Line
                        type="monotone"
                        dataKey="avgHoursPerPerson"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Průměr hodin"
                        dot={{ fill: "#10b981", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="goalAchievers"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Splnili 40h"
                        dot={{ fill: "#f59e0b", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Active Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Aktivní členové týmu</CardTitle>
                  <CardDescription>Počet lidí s alespoň 1 hodinou práce</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyData}>
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
                      <Bar 
                        dataKey="activeMembers" 
                        fill="#8b5cf6" 
                        name="Aktivní členové"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Project Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Trendy projektů</CardTitle>
                <CardDescription>Vývoj času stráveného na jednotlivých projektech</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectTrends}>
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
                    {Object.keys(PROJECT_COLORS).map(project => (
                      <Line
                        key={project}
                        type="monotone"
                        dataKey={project}
                        stroke={PROJECT_COLORS[project]}
                        strokeWidth={2}
                        name={project}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Žádná data k zobrazení
          </div>
        )}
      </div>
    </div>
  )
}
