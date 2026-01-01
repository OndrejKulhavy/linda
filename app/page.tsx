"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Clock, ArrowRight, Trophy, CalendarDays, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChangelogDialog } from "@/components/ChangelogDialog"

export default function Home() {
  const [changelogOpen, setChangelogOpen] = useState(false)
  const latestChangeDate = '2024-12-27' // Update this when adding new changes
  
  // Compute hasNewChanges directly without useEffect to avoid cascading renders
  const [hasNewChanges, setHasNewChanges] = useState(() => {
    if (typeof window === 'undefined') return false
    const lastViewed = localStorage.getItem('lastViewedChangelog')
    
    if (!lastViewed) {
      // First time visitor - show badge
      return true
    } else {
      const lastViewedDate = new Date(lastViewed)
      const latestDate = new Date(latestChangeDate)
      
      return latestDate > lastViewedDate
    }
  })

  const handleOpenChangelog = () => {
    setChangelogOpen(true)
    setHasNewChanges(false)
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenChangelog}
          className="relative pointer-events-auto"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Co je nového?
          {hasNewChanges && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full"
            >
              <span className="sr-only">New changes</span>
            </Badge>
          )}
        </Button>
        <ThemeToggle />
      </div>
      <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
      <div className="container mx-auto px-4 py-12 sm:py-24 relative z-10">
        <div className="text-center mb-12 sm:mb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent -z-10 rounded-3xl blur-3xl" />
          <div className="inline-block mb-4 text-5xl sm:text-6xl animate-bounce-slow">
            🤖
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-3 sm:mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Linda
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 mb-3">
            Jsem geniální asistentka týmu <span className="font-semibold text-primary">Tuuli</span>, váš vítr v plachtách pro sledování výkonnosti.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground/80 max-w-xl mx-auto px-4">
            📊 Nejen data a analýzy, ale i <span className="text-primary font-medium">připomínky</span>, <span className="text-primary font-medium">notifikace</span> a inteligentní asistenci pro váš tým.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          <Link href="/charts/user-hours" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.98] border-primary/10">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    Družstevníci
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-100 sm:opacity-0 translate-x-0 sm:-translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Kdo jak maká na JZD? Tady to zjistíš!
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/charts/work-hours" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.98] border-primary/10">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    Čtyřicethodin
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-100 sm:opacity-0 translate-x-0 sm:-translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Kolik hodin už uteklo? Časová osa neúprosně běží!
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/charts/projects" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.98] border-primary/10">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    Koláček
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-100 sm:opacity-0 translate-x-0 sm:-translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Kdo si ukrojil největší díl koláče? Projekty v kostce!
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/charts/competition" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.98] border-primary/10">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    Soutěž
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-100 sm:opacity-0 translate-x-0 sm:-translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Kdo čte nejvíc? Kdo pracuje nejméně? Dramatické odhalení!
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/calendar" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.98] border-primary/10">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    Docházka
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-100 sm:opacity-0 translate-x-0 sm:-translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Kalendář, docházka a statistiky - vše přehledně!
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
