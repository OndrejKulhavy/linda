"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkHoursChart, type WorkHoursData } from "@/components/WorkHoursChart"

export default function DashboardPage() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [data, setData] = useState<WorkHoursData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalHours = data.reduce((sum, d) => sum + d.hours, 0)
  const totalGoal = data.reduce((sum, d) => sum + d.goal, 0)

  const handleFetch = async () => {
    if (!from || !to) {
      setError("Please select both from and to dates")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clockify?from=${from}&to=${to}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data")
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Work Hours Dashboard</h1>

      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Select Date Range</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="from" className="text-sm font-medium">
                  From
                </label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="to" className="text-sm font-medium">
                  To
                </label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <Button onClick={handleFetch} disabled={loading} className="w-full sm:w-auto h-10">
              {loading ? "Loading..." : "Fetch Data"}
            </Button>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Work Hours Chart</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {data.length > 0 ? (
            <WorkHoursChart data={data} totalHours={totalHours} totalGoal={totalGoal} />
          ) : (
            <div className="flex items-center justify-center h-[300px] sm:h-[400px] text-muted-foreground text-center px-4">
              Select a date range and click &quot;Fetch Data&quot; to view your work hours
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
