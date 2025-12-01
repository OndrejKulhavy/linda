"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, X } from "lucide-react"

const COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444",
  "#ec4899", "#6366f1", "#14b8a6", "#84cc16", "#f97316",
]

function getLastWeekRange() {
  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)
  return {
    from: lastWeek.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  }
}

interface ProjectHours {
  project: string
  hours: number
}

export default function ProjectsPage() {
  const defaultRange = getLastWeekRange()
  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)
  const [data, setData] = useState<ProjectHours[]>([])
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredData = data.filter((d) => !hiddenProjects.has(d.project))

  const toggleProject = (project: string) => {
    setHiddenProjects((prev) => {
      const next = new Set(prev)
      if (next.has(project)) {
        next.delete(project)
      } else {
        next.add(project)
      }
      return next
    })
  }

  const handleFetch = useCallback(async (fromDate: string, toDate: string) => {
    if (!fromDate || !toDate) {
      setError("Vyber prosím obě data")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clockify/projects?from=${fromDate}&to=${toDate}`)
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
      <div className="container mx-auto p-6">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-6">Projekty</h1>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label htmlFor="from" className="text-sm text-muted-foreground">Od</label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[140px] h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="to" className="text-sm text-muted-foreground">Do</label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-[140px] h-9"
            />
          </div>
          <Button onClick={() => handleFetch(from, to)} disabled={loading} size="sm">
            {loading ? "Načítám..." : "Načíst"}
          </Button>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>

        {data.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {data.map((d, index) => {
              const isHidden = hiddenProjects.has(d.project)
              return (
                <Badge
                  key={d.project}
                  variant={isHidden ? "outline" : "default"}
                  className="cursor-pointer select-none gap-1.5 pr-1.5"
                  style={{
                    backgroundColor: isHidden ? "transparent" : COLORS[index % COLORS.length],
                    borderColor: COLORS[index % COLORS.length],
                    color: isHidden ? COLORS[index % COLORS.length] : "white",
                  }}
                  onClick={() => toggleProject(d.project)}
                >
                  {d.project}
                  {!isHidden && <X className="w-3 h-3 opacity-70 hover:opacity-100" />}
                </Badge>
              )
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Hodiny podle projektů</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={filteredData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={2}
                    dataKey="hours"
                    nameKey="project"
                    label={({ project, percent }) => `${project} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: "#6b7280" }}
                  >
                    {filteredData.map((d) => {
                      const originalIndex = data.findIndex((orig) => orig.project === d.project)
                      return (
                        <Cell key={`cell-${d.project}`} fill={COLORS[originalIndex % COLORS.length]} />
                      )
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#f3f4f6",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} hodin`, "Hodiny"]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span style={{ color: "#9ca3af" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
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
