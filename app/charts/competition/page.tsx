"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Trophy, ChevronRight, ChevronLeft, Award, BookOpen } from "lucide-react"
import { PieChart, Pie, Cell } from "recharts"
import confetti from "canvas-confetti"

type CompetitionMode = "reading" | "40hours"
type RevealStage = "idle" | "countdown" | "presenting" | "summary"

interface UserBreakdown {
  name: string
  total: number
  reading: number
  practice: number
  training: number
}

interface ReadingUser {
  name: string
  hours: number
}

const COLORS = {
  reading: "hsl(142, 76%, 36%)",    // emerald
  practice: "hsl(221, 83%, 53%)",   // blue
  training: "hsl(25, 95%, 53%)",    // orange
}

const chartConfig = {
  reading: { label: "Reading", color: COLORS.reading },
  practice: { label: "Practice", color: COLORS.practice },
  training: { label: "Training", color: COLORS.training },
}

function getLastWeekRange() {
  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)
  return {
    from: lastWeek.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  }
}

function fireConfetti() {
  const duration = 3000
  const end = Date.now() + duration

  const colors = ["#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"]

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    })
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()

  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors,
  })
}

export default function CompetitionPage() {
  const defaultRange = getLastWeekRange()
  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<CompetitionMode | null>(null)
  const [stage, setStage] = useState<RevealStage>("idle")
  const [countdown, setCountdown] = useState(3)
  const [achievers, setAchievers] = useState<UserBreakdown[]>([])
  const [readingData, setReadingData] = useState<ReadingUser[]>([])
  const [currentAchieverIndex, setCurrentAchieverIndex] = useState(0)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const TARGET_HOURS = 40

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clockify/users?from=${from}&to=${to}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      // Aggregate hours per user per project type
      const userDataMap = new Map<string, { reading: number; practice: number; training: number }>()

      for (const entry of result.data) {
        const current = userDataMap.get(entry.name) || { reading: 0, practice: 0, training: 0 }
        
        if (entry.project === "Reading") {
          current.reading += entry.hours
        } else if (entry.project === "Practice") {
          current.practice += entry.hours
        } else if (entry.project === "Training") {
          current.training += entry.hours
        }
        
        userDataMap.set(entry.name, current)
      }

      // Filter users who achieved 40+ hours and create breakdown
      const achieversList: UserBreakdown[] = Array.from(userDataMap.entries())
        .map(([name, data]) => ({
          name,
          total: Math.round((data.reading + data.practice + data.training) * 10) / 10,
          reading: Math.round(data.reading * 10) / 10,
          practice: Math.round(data.practice * 10) / 10,
          training: Math.round(data.training * 10) / 10,
        }))
        .filter(user => user.total >= TARGET_HOURS)
        .sort((a, b) => b.total - a.total)

      setAchievers(achieversList)
      return achieversList
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
      return []
    } finally {
      setLoading(false)
    }
  }, [from, to])

  const fetchReadingData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clockify/users?from=${from}&to=${to}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      const userHoursMap = new Map<string, number>()

      for (const entry of result.data) {
        if (entry.project === "Reading") {
          const current = userHoursMap.get(entry.name) || 0
          userHoursMap.set(entry.name, current + entry.hours)
        }
      }

      const readingList: ReadingUser[] = Array.from(userHoursMap.entries())
        .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
        .sort((a, b) => b.hours - a.hours)

      setReadingData(readingList)
      return readingList
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
      return []
    } finally {
      setLoading(false)
    }
  }, [from, to])

  const startPresentation = async () => {
    setMode("40hours")
    const data = await fetchData()
    
    if (data.length === 0) {
      setError("Nikdo nedosáhl 40 hodin tento týden 😢")
      return
    }

    setCurrentAchieverIndex(0)
    setStage("countdown")
    setCountdown(3)
  }

  const startReadingCompetition = async () => {
    setMode("reading")
    const data = await fetchReadingData()
    
    if (data.length === 0) {
      setError("Žádná data o čtení")
      return
    }

    setStage("countdown")
    setCountdown(3)
  }

  useEffect(() => {
    if (stage === "countdown") {
      if (countdown > 0) {
        countdownRef.current = setTimeout(() => {
          setCountdown(countdown - 1)
        }, 1000)
      } else {
        setStage("presenting")
        fireConfetti()
      }
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
    }
  }, [stage, countdown])

  const handleNext = () => {
    if (mode === "40hours") {
      if (currentAchieverIndex < achievers.length - 1) {
        setCurrentAchieverIndex(currentAchieverIndex + 1)
        fireConfetti()
      } else {
        setStage("summary")
      }
    } else if (mode === "reading") {
      setStage("summary")
    }
  }

  const handlePrev = () => {
    if (currentAchieverIndex > 0) {
      setCurrentAchieverIndex(currentAchieverIndex - 1)
    }
  }

  const reset = () => {
    setStage("idle")
    setMode(null)
    setAchievers([])
    setReadingData([])
    setCurrentAchieverIndex(0)
    setCountdown(3)
  }

  const currentAchiever = achievers[currentAchieverIndex]
  const readingWinner = readingData[0]

  const getPieData = (user: UserBreakdown) => [
    { name: "Reading", value: user.reading, fill: COLORS.reading },
    { name: "Practice", value: user.practice, fill: COLORS.practice },
    { name: "Training", value: user.training, fill: COLORS.training },
  ].filter(item => item.value > 0)

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

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Soutěž</h1>

        {stage === "idle" && (
          <>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <label htmlFor="from" className="text-sm text-muted-foreground min-w-7">Od</label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="flex-1 sm:w-[140px] h-10 sm:h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="to" className="text-sm text-muted-foreground min-w-7">Do</label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex-1 sm:w-[140px] h-10 sm:h-9"
                />
              </div>
              {error && <span className="text-sm text-red-500">{error}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:border-emerald-500/50 active:scale-[0.98]"
                onClick={() => !loading && startReadingCompetition()}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Čtení</CardTitle>
                      <p className="text-sm text-muted-foreground">Kdo četl nejvíce hodin?</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:border-yellow-500/50 active:scale-[0.98]"
                onClick={() => !loading && startPresentation()}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">40 hodin týdně 🎯</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Kdo splnil týdenní cíl?
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {loading && (
              <div className="flex items-center justify-center mt-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-foreground" />
              </div>
            )}
          </>
        )}

        {stage === "countdown" && (
          <Card>
            <CardContent className="p-8 sm:p-16">
              <div className="flex flex-col items-center justify-center">
                <div className="text-8xl sm:text-[150px] font-black text-foreground animate-pulse">
                  {countdown || "!"}
                </div>
                <p className="text-lg text-muted-foreground mt-4">
                  {mode === "reading" ? "Kdo četl nejvíce?" : "Kdo splnil 40 hodin?"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "presenting" && mode === "reading" && readingWinner && (
          <Card>
            <CardHeader className="p-4 sm:p-6 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-lg text-muted-foreground">Vítěz čtení 📚</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 text-center">
              <div className="text-4xl sm:text-6xl font-bold text-foreground mb-2">
                {readingWinner.name}
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-muted-foreground mb-6">
                {readingWinner.hours} hodin čtení
              </div>
              <Button onClick={handleNext}>
                Zobrazit žebříček <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === "presenting" && mode === "40hours" && currentAchiever && (
          <Card>
            <CardHeader className="p-4 sm:p-6 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-lg text-muted-foreground">
                {currentAchieverIndex + 1} z {achievers.length} 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 text-center">
              <div className="text-4xl sm:text-6xl font-bold text-foreground mb-2">
                {currentAchiever.name}
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-muted-foreground mb-6">
                {currentAchiever.total} hodin
              </div>
              
              <div className="flex justify-center mb-6">
                <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={getPieData(currentAchiever)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                    >
                      {getPieData(currentAchiever).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>

              <div className="flex justify-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.reading }} />
                  <span>Reading: {currentAchiever.reading}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.practice }} />
                  <span>Practice: {currentAchiever.practice}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.training }} />
                  <span>Training: {currentAchiever.training}h</span>
                </div>
              </div>

              <div className="flex justify-center gap-2">
                {currentAchieverIndex > 0 && (
                  <Button variant="outline" onClick={handlePrev}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Předchozí
                  </Button>
                )}
                <Button onClick={handleNext}>
                  {currentAchieverIndex < achievers.length - 1 ? (
                    <>Další <ChevronRight className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>Souhrn <ChevronRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "summary" && mode === "reading" && (
          <Card>
            <CardHeader className="p-4 sm:p-6 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-lg text-muted-foreground">Žebříček čtení 📚</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-2 max-h-[400px] overflow-y-auto mb-6">
                {readingData.map((user, index) => (
                  <div
                    key={user.name}
                    className={`flex items-center justify-between p-3 rounded ${
                      index === 0 
                        ? "bg-yellow-500/10 border border-yellow-500/30" 
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold w-8 ${index === 0 ? "text-yellow-500" : ""}`}>
                        {index + 1}.
                      </span>
                      <span className={`font-medium ${index === 0 ? "text-yellow-500" : ""}`}>
                        {user.name}
                      </span>
                    </div>
                    <span className={`font-mono ${index === 0 ? "text-yellow-500 font-bold" : "text-muted-foreground"}`}>
                      {user.hours}h
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <Button onClick={reset}>
                  Znovu
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "summary" && mode === "40hours" && (
          <Card>
            <CardHeader className="p-4 sm:p-6 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-lg text-muted-foreground">
                {achievers.length} {achievers.length === 1 ? "člověk splnil" : achievers.length < 5 ? "lidé splnili" : "lidí splnilo"} 40 hodin! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {achievers.map((user, index) => (
                  <div key={user.name} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold">{index + 1}.</span>
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-muted-foreground ml-auto">{user.total}h</span>
                    </div>
                    <div className="flex justify-center">
                      <ChartContainer config={chartConfig} className="h-[100px] w-[100px]">
                        <PieChart>
                          <Pie
                            data={getPieData(user)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={40}
                          >
                            {getPieData(user).map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </div>
                    <div className="flex justify-center gap-2 text-xs mt-2">
                      <span style={{ color: COLORS.reading }}>R: {user.reading}h</span>
                      <span style={{ color: COLORS.practice }}>P: {user.practice}h</span>
                      <span style={{ color: COLORS.training }}>T: {user.training}h</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <Button onClick={reset}>
                  Znovu
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}