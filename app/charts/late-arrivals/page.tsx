"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import LateArrivalsChart from "@/components/LateArrivalsChart"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Plus } from "lucide-react"
import { getAllFullNames } from "@/lib/team-members"
import { createClient } from "@/lib/supabase/client"

function getCurrentMonthRange() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: startOfMonth.toISOString().split("T")[0],
    to: endOfMonth.toISOString().split("T")[0],
  }
}

interface ChartData {
  name: string
  count: number
  trainingCount: number
  meetingCount: number
}

interface AttendanceRecord {
  employee_name: string
  type: string
  date: string
  created_at: string
}

interface DetailedChartData extends ChartData {
  records: AttendanceRecord[]
}

export default function LateArrivalsPage() {
  const defaultRange = getCurrentMonthRange()
  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)
  const [data, setData] = useState<DetailedChartData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  const handleFetch = useCallback(async (fromDate: string, toDate: string) => {
    if (!fromDate || !toDate) {
      setError("Vyber prosím obě data")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/attendance?from=${fromDate}&to=${toDate}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nepodařilo se načíst data")
      }

      // Process data for chart
      const allMembers = getAllFullNames()
      const countMap = new Map<string, { training: number; meeting: number }>()
      const recordsMap = new Map<string, AttendanceRecord[]>()

      // Initialize all members with zero counts
      allMembers.forEach(name => {
        countMap.set(name, { training: 0, meeting: 0 })
        recordsMap.set(name, [])
      })

      // Count late arrivals and store records
      result.records?.forEach((record: AttendanceRecord) => {
        const current = countMap.get(record.employee_name) || { training: 0, meeting: 0 }
        const records = recordsMap.get(record.employee_name) || []
        
        records.push(record)
        
        if (record.type === 'Training Session') {
          current.training++
        } else if (record.type === 'Team Meeting') {
          current.meeting++
        }
        countMap.set(record.employee_name, current)
        recordsMap.set(record.employee_name, records)
      })

      // Convert to chart data (only include members with at least one late arrival)
      const chartData = allMembers
        .map(name => {
          const counts = countMap.get(name) || { training: 0, meeting: 0 }
          const records = recordsMap.get(name) || []
          return {
            name,
            count: counts.training + counts.meeting,
            trainingCount: counts.training,
            meetingCount: counts.meeting,
            records,
          }
        })
        .filter(d => d.count > 0)

      setData(chartData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo k chybě")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    handleFetch(from, to)
  }, [from, to, handleFetch])

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
          <div className="flex gap-2">
            {isLoggedIn && (
              <Link href="/attendance/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat pozdní příchod
                </Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Spinks</h1>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-4 sm:mb-6">
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
          <Button onClick={() => handleFetch(from, to)} disabled={loading} size="sm" className="w-full sm:w-auto h-10 sm:h-9">
            {loading ? "Načítám..." : "Načíst"}
          </Button>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>

        <LateArrivalsChart data={data} />
      </div>
    </div>
  )
}
