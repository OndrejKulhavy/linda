"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserHoursTreemap, type UserProjectHours } from "@/components/UserHoursTreemap"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft } from "lucide-react"

function getLastWeekRange() {
  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)
  return {
    from: lastWeek.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  }
}

export default function UserHoursPage() {
  const defaultRange = getLastWeekRange()
  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)
  const [data, setData] = useState<UserProjectHours[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          <Button onClick={() => handleFetch(from, to)} disabled={loading} size="sm" className="w-full sm:w-auto h-10 sm:h-9">
            {loading ? "Načítám..." : "Načíst"}
          </Button>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Odpracované hodiny</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {data.length > 0 ? (
              <UserHoursTreemap data={data} dateRange={{ from, to }} />
            ) : (
              <div className="flex items-center justify-center h-[300px] sm:h-[500px] text-muted-foreground text-center px-4">
                Vyber časové období a klikni na &quot;Načíst data&quot;
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
