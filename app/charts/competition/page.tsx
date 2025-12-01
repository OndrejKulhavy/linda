"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, BookOpen, Briefcase, Trophy, Medal, ChevronRight } from "lucide-react"
import confetti from "canvas-confetti"

type CompetitionMode = "reading" | "work"
type RevealStage = "idle" | "countdown" | "reveal-winner" | "reveal-loser"

interface UserHours {
  name: string
  hours: number
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
  const [userData, setUserData] = useState<UserHours[]>([])
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async (competitionMode: CompetitionMode) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clockify/users?from=${from}&to=${to}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      const projectsToInclude = competitionMode === "reading" 
        ? ["Reading"] 
        : ["Practice", "Reading", "Training"]

      const userHoursMap = new Map<string, number>()

      for (const entry of result.data) {
        if (projectsToInclude.includes(entry.project)) {
          const current = userHoursMap.get(entry.name) || 0
          userHoursMap.set(entry.name, current + entry.hours)
        }
      }

      const aggregated: UserHours[] = Array.from(userHoursMap.entries())
        .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
        .sort((a, b) => b.hours - a.hours)

      setUserData(aggregated)
      return aggregated
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
      return []
    } finally {
      setLoading(false)
    }
  }, [from, to])

  const startCompetition = async (competitionMode: CompetitionMode) => {
    setMode(competitionMode)
    const data = await fetchData(competitionMode)
    
    if (data.length === 0) {
      setError("Žádná data k zobrazení")
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
        setStage("reveal-winner")
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
    if (stage === "reveal-winner") {
      setStage("reveal-loser")
    } else if (stage === "reveal-loser") {
      setStage("idle")
      setMode(null)
      setUserData([])
    }
  }

  const reset = () => {
    setStage("idle")
    setMode(null)
    setUserData([])
    setCountdown(3)
  }

  const winner = userData[0]
  const loser = userData[userData.length - 1]

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
                <label htmlFor="from" className="text-sm text-muted-foreground min-w-[28px]">Od</label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="flex-1 sm:w-[140px] h-10 sm:h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="to" className="text-sm text-muted-foreground min-w-[28px]">Do</label>
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
                onClick={() => !loading && startCompetition("reading")}
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
                className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-500/50 active:scale-[0.98]"
                onClick={() => !loading && startCompetition("work")}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Hodiny</CardTitle>
                      <p className="text-sm text-muted-foreground">Practice + Reading + Training</p>
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
                  {mode === "reading" ? "Čtení" : "Hodiny práce"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "reveal-winner" && winner && (
          <Card>
            <CardHeader className="p-4 sm:p-6 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-lg text-muted-foreground">Vítěz</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 text-center">
              <div className="text-4xl sm:text-6xl font-bold text-foreground mb-2">
                {winner.name}
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-muted-foreground mb-6">
                {winner.hours} hodin
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {mode === "reading" ? "Nejvíce hodin čtení" : "Nejvíce odpracovaných hodin"}
              </p>
              <Button onClick={handleNext}>
                Další <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === "reveal-loser" && loser && (
          <Card>
            <CardHeader className="p-4 sm:p-6 text-center">
              <div className="flex justify-center mb-2">
                <Medal className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg text-muted-foreground">Nejméně hodin</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 text-center">
              <div className="text-4xl sm:text-6xl font-bold text-foreground mb-2">
                {loser.name}
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-muted-foreground mb-6">
                {loser.hours} hodin
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {mode === "reading" ? "Nejméně hodin čtení" : "Nejméně odpracovaných hodin"}
              </p>
              
              <div className="border rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3">Celkové pořadí</h3>
                <div className="space-y-2">
                  {userData.map((user, index) => (
                    <div
                      key={user.name}
                      className={`flex items-center justify-between p-2 rounded ${
                        index === 0 
                          ? "bg-yellow-500/10" 
                          : index === userData.length - 1 
                          ? "bg-muted"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium w-6">{index + 1}.</span>
                        <span className="text-sm">{user.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground font-mono">{user.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={reset}>
                Znovu
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}