"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Trophy, Medal, Award, Star, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserStats {
  name: string
  totalHours: number
  avgHoursPerWeek: number
  weeksActive: number
  consistency: number
  projectCount: number
  readingHours: number
  practiceHours: number
  trainingHours: number
  rank: number
  weekChange: number
}

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

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weeksToShow, setWeeksToShow] = useState<number>(4)
  const [sortBy, setSortBy] = useState<"total" | "average" | "consistency">("total")

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    const range = getLastNWeeksRange(weeksToShow)

    try {
      const response = await fetch(`/api/clockify/users/details?from=${range.from}&to=${range.to}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      // Group by user and week
      const userWeeklyMap = new Map<string, Map<string, number>>()
      const userProjectMap = new Map<string, { reading: number; practice: number; training: number; projects: Set<string> }>()

      result.data.forEach((entry: any) => {
        const week = getWeekNumber(new Date(entry.date))
        
        // Weekly hours
        if (!userWeeklyMap.has(entry.userName)) {
          userWeeklyMap.set(entry.userName, new Map())
        }
        const weeklyHours = userWeeklyMap.get(entry.userName)!
        weeklyHours.set(week, (weeklyHours.get(week) || 0) + entry.hours)

        // Project hours
        if (!userProjectMap.has(entry.userName)) {
          userProjectMap.set(entry.userName, { reading: 0, practice: 0, training: 0, projects: new Set() })
        }
        const projectData = userProjectMap.get(entry.userName)!
        projectData.projects.add(entry.projectName)
        
        if (entry.projectName === "Reading") {
          projectData.reading += entry.hours
        } else if (entry.projectName === "Practice") {
          projectData.practice += entry.hours
        } else if (entry.projectName === "Training") {
          projectData.training += entry.hours
        }
      })

      // Calculate stats for each user
      const stats: UserStats[] = []
      
      userWeeklyMap.forEach((weeklyHours, userName) => {
        const totalHours = Array.from(weeklyHours.values()).reduce((sum, h) => sum + h, 0)
        const weeksActive = weeklyHours.size
        const avgHours = totalHours / weeksActive
        
        // Calculate consistency (how close to 40h avg)
        const consistency = Math.max(0, 100 - (Math.abs(40 - avgHours) / 40) * 100)
        
        const projectData = userProjectMap.get(userName)!
        
        stats.push({
          name: userName,
          totalHours: Math.round(totalHours * 10) / 10,
          avgHoursPerWeek: Math.round(avgHours * 10) / 10,
          weeksActive,
          consistency: Math.round(consistency),
          projectCount: projectData.projects.size,
          readingHours: Math.round(projectData.reading * 10) / 10,
          practiceHours: Math.round(projectData.practice * 10) / 10,
          trainingHours: Math.round(projectData.training * 10) / 10,
          rank: 0,
          weekChange: 0,
        })
      })

      // Sort and assign ranks based on current sort criteria
      let sortedStats = [...stats]
      if (sortBy === "total") {
        sortedStats.sort((a, b) => b.totalHours - a.totalHours)
      } else if (sortBy === "average") {
        sortedStats.sort((a, b) => b.avgHoursPerWeek - a.avgHoursPerWeek)
      } else {
        sortedStats.sort((a, b) => b.consistency - a.consistency)
      }

      sortedStats.forEach((stat, index) => {
        stat.rank = index + 1
      })

      setLeaderboard(sortedStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
    } finally {
      setLoading(false)
    }
  }, [weeksToShow, sortBy])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
    return <Star className="w-5 h-5 text-muted-foreground" />
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
    if (rank === 2) return "bg-gray-400/10 text-gray-400 border-gray-400/30"
    if (rank === 3) return "bg-amber-600/10 text-amber-600 border-amber-600/30"
    return "bg-muted/50 text-muted-foreground"
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

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Žebříček výkonu</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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

          <div className="flex items-center gap-2">
            <label htmlFor="sort-selector" className="text-sm text-muted-foreground whitespace-nowrap">
              Řadit podle
            </label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger id="sort-selector" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Celkové hodiny</SelectItem>
                <SelectItem value="average">Průměr týdně</SelectItem>
                <SelectItem value="consistency">Konzistence</SelectItem>
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
        ) : leaderboard.length > 0 ? (
          <div className="space-y-6">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <Card className="mt-8">
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(2)}
                    </div>
                    <CardTitle className="text-lg">{leaderboard[1].name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold mb-1">
                      {sortBy === "total" && `${leaderboard[1].totalHours}h`}
                      {sortBy === "average" && `${leaderboard[1].avgHoursPerWeek}h`}
                      {sortBy === "consistency" && `${leaderboard[1].consistency}%`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      2. místo
                    </div>
                  </CardContent>
                </Card>

                {/* 1st Place */}
                <Card className="border-2 border-yellow-500/50 shadow-lg">
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(1)}
                    </div>
                    <CardTitle className="text-xl">{leaderboard[0].name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      {sortBy === "total" && `${leaderboard[0].totalHours}h`}
                      {sortBy === "average" && `${leaderboard[0].avgHoursPerWeek}h`}
                      {sortBy === "consistency" && `${leaderboard[0].consistency}%`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      🏆 Vítěz
                    </div>
                  </CardContent>
                </Card>

                {/* 3rd Place */}
                <Card className="mt-8">
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(3)}
                    </div>
                    <CardTitle className="text-lg">{leaderboard[2].name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold mb-1">
                      {sortBy === "total" && `${leaderboard[2].totalHours}h`}
                      {sortBy === "average" && `${leaderboard[2].avgHoursPerWeek}h`}
                      {sortBy === "consistency" && `${leaderboard[2].consistency}%`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      3. místo
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Full Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Kompletní žebříček</CardTitle>
                <CardDescription>
                  Všichni členové týmu seřazeni podle {sortBy === "total" ? "celkových hodin" : sortBy === "average" ? "průměrných hodin" : "konzistence"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((user) => (
                    <div
                      key={user.name}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        user.rank <= 3 ? getRankBadgeColor(user.rank) : "bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(user.rank)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{user.name}</div>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>Celkem: {user.totalHours}h</span>
                          <span>Průměr: {user.avgHoursPerWeek}h</span>
                          <span>Konzistence: {user.consistency}%</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {user.projectCount} {user.projectCount === 1 ? "projekt" : "projekty"}
                        </Badge>
                        <Badge 
                          variant={user.avgHoursPerWeek >= 40 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {user.avgHoursPerWeek >= 40 ? "✓ Cíl" : "○ Nedosaženo"}
                        </Badge>
                      </div>

                      <div className="text-right min-w-[80px]">
                        <div className="text-2xl font-bold">
                          {sortBy === "total" && `${user.totalHours}h`}
                          {sortBy === "average" && `${user.avgHoursPerWeek}h`}
                          {sortBy === "consistency" && `${user.consistency}%`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Detailní statistiky</CardTitle>
                <CardDescription>Rozdělení času podle typů projektů</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Pořadí</th>
                        <th className="text-left p-2">Jméno</th>
                        <th className="text-right p-2">Reading</th>
                        <th className="text-right p-2">Practice</th>
                        <th className="text-right p-2">Training</th>
                        <th className="text-right p-2">Týdnů aktivních</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((user) => (
                        <tr key={user.name} className="border-b">
                          <td className="p-2">{user.rank}</td>
                          <td className="p-2 font-medium">{user.name}</td>
                          <td className="text-right p-2">{user.readingHours}h</td>
                          <td className="text-right p-2">{user.practiceHours}h</td>
                          <td className="text-right p-2">{user.trainingHours}h</td>
                          <td className="text-right p-2">{user.weeksActive}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
