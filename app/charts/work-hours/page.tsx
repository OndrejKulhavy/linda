"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkHoursChart, type WorkHoursData } from "@/components/WorkHoursChart"
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

export default function WorkHoursPage() {
  const defaultRange = getLastWeekRange()
  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)
  const [data, setData] = useState<WorkHoursData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async () => {
    if (!from || !to) {
      setError("Vyber prosím obě data")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clockify?from=${from}&to=${to}`)
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
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-6">Odpracované hodiny</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vyber časové období</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="from" className="text-sm font-medium">
                  Od
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
                  Do
                </label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <Button onClick={handleFetch} disabled={loading}>
                {loading ? "Načítám..." : "Načíst data"}
              </Button>
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Graf odpracovaných hodin</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <WorkHoursChart data={data} />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                Vyber časové období a klikni na &quot;Načíst data&quot;
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
