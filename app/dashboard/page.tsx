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
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Work Hours Dashboard</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex flex-col gap-2 flex-1">
              <label htmlFor="from" className="text-sm font-medium">
                From
              </label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label htmlFor="to" className="text-sm font-medium">
                To
              </label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <Button onClick={handleFetch} disabled={loading}>
              {loading ? "Loading..." : "Fetch Data"}
            </Button>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Hours Chart</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <WorkHoursChart data={data} totalHours={totalHours} totalGoal={totalGoal} />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Select a date range and click &quot;Fetch Data&quot; to view your work hours
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
