'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Loader2, ChevronDown, ChevronUp, Users, TrendingUp } from 'lucide-react'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, LabelList } from 'recharts'

interface SessionInfo {
  id: string
  title: string
  date: string
}

interface FacilitatorStats {
  name: string
  count: number
  sessions: SessionInfo[]
}

interface ApiResponse {
  statistics: FacilitatorStats[]
  totalSessions: number
  dateRange: {
    start: string | null
    end: string | null
  }
}

interface DateRange {
  value: string
  label: string
  startDate: string
  endDate: string
}

function getDateRanges(): DateRange[] {
  const now = new Date()
  const ranges: DateRange[] = []

  // Current year
  const currentYear = now.getFullYear()
  ranges.push({
    value: `${currentYear}`,
    label: `${currentYear}`,
    startDate: `${currentYear}-01-01`,
    endDate: `${currentYear}-12-31`,
  })

  // Previous year
  ranges.push({
    value: `${currentYear - 1}`,
    label: `${currentYear - 1}`,
    startDate: `${currentYear - 1}-01-01`,
    endDate: `${currentYear - 1}-12-31`,
  })

  // Last 6 months
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  ranges.push({
    value: 'last-6-months',
    label: 'Posledních 6 měsíců',
    startDate: sixMonthsAgo.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  })

  // Last 3 months
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  ranges.push({
    value: 'last-3-months',
    label: 'Poslední 3 měsíce',
    startDate: threeMonthsAgo.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  })

  // All time
  ranges.push({
    value: 'all',
    label: 'Vše',
    startDate: '',
    endDate: '',
  })

  return ranges
}

export default function TSFacilitatorsPage() {
  const [statistics, setStatistics] = useState<FacilitatorStats[]>([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState<string>('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  const dateRanges = useMemo(() => getDateRanges(), [])

  useEffect(() => {
    if (dateRanges.length > 0 && !selectedRange) {
      setSelectedRange(dateRanges[0].value)
    }
  }, [dateRanges, selectedRange])

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedRange) return
      
      setLoading(true)
      try {
        const range = dateRanges.find(r => r.value === selectedRange)
        if (!range) return

        const params = new URLSearchParams()
        if (range.startDate) params.set('startDate', range.startDate)
        if (range.endDate) params.set('endDate', range.endDate)

        const response = await fetch(`/api/ts-facilitators?${params}`)
        const data: ApiResponse = await response.json()
        
        setStatistics(data.statistics || [])
        setTotalSessions(data.totalSessions || 0)
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [selectedRange, dateRanges])

  const toggleRow = (name: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(name)) {
      newExpanded.delete(name)
    } else {
      newExpanded.add(name)
    }
    setExpandedRows(newExpanded)
  }

  // Prepare chart data - only show people with at least 1 facilitation
  const chartData = useMemo(() => {
    return statistics
      .filter(s => s.count > 0)
      .map(s => ({
        name: s.name.split(' ')[0], // First name only for chart
        count: s.count,
        fullName: s.name,
      }))
  }, [statistics])

  // Calculate statistics
  const statsWithFacilitation = statistics.filter(s => s.count > 0)
  const statsWithoutFacilitation = statistics.filter(s => s.count === 0)
  const averageFacilitations = statsWithFacilitation.length > 0
    ? (statsWithFacilitation.reduce((sum, s) => sum + s.count, 0) / statsWithFacilitation.length).toFixed(1)
    : '0'

  // Color scale for bar chart - green for average+, yellow for below average, red for 0
  const getBarColor = (count: number) => {
    if (count === 0) return 'hsl(var(--destructive))'
    const avg = parseFloat(averageFacilitations)
    if (count >= avg) return 'hsl(var(--chart-2))' // Green
    return 'hsl(var(--chart-3))' // Yellow
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zpět
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Facilitace TS</h1>
              <p className="text-sm text-muted-foreground">
                Statistiky vedení Training Session
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedRange} onValueChange={setSelectedRange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Vyberte období" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Celkem TS</CardDescription>
                  <CardTitle className="text-3xl">{totalSessions}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Lidé s facilitací</CardDescription>
                  <CardTitle className="text-3xl">
                    {statsWithFacilitation.length}
                    <span className="text-base text-muted-foreground ml-1">
                      / {statistics.length}
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Průměr na osobu</CardDescription>
                  <CardTitle className="text-3xl">{averageFacilitations}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Bez facilitace</CardDescription>
                  <CardTitle className="text-3xl text-destructive">
                    {statsWithoutFacilitation.length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Počet facilitovaných TS
                  </CardTitle>
                  <CardDescription>
                    Zobrazeni pouze lidé, kteří facilitovali alespoň 1 TS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: {
                        label: 'Počet TS',
                        color: 'hsl(var(--chart-1))',
                      },
                    }}
                    className="h-[400px] w-full"
                  >
                    <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 60, left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="font-semibold">{payload[0].payload.fullName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {payload[0].value} TS
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.count)} />
                        ))}
                        <LabelList dataKey="count" position="top" fontSize={12} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Detailní přehled
                </CardTitle>
                <CardDescription>
                  Klikněte na řádek pro zobrazení jednotlivých TS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Jméno</TableHead>
                      <TableHead className="text-right">Počet TS</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.map((stat) => (
                      <>
                        <TableRow
                          key={stat.name}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleRow(stat.name)}
                        >
                          <TableCell>
                            {stat.sessions.length > 0 && (
                              expandedRows.has(stat.name) ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{stat.name}</TableCell>
                          <TableCell className="text-right">
                            <span className={stat.count === 0 ? 'text-muted-foreground' : ''}>
                              {stat.count}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.count === 0 ? (
                              <Badge variant="destructive">Žádná facilitace</Badge>
                            ) : stat.count >= parseFloat(averageFacilitations) ? (
                              <Badge variant="default" className="bg-green-500">Nad průměrem</Badge>
                            ) : (
                              <Badge variant="secondary">Pod průměrem</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(stat.name) && stat.sessions.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="bg-muted/30 p-4">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold mb-2">Facilitované TS:</p>
                                <div className="space-y-1">
                                  {stat.sessions.map((session) => (
                                    <div
                                      key={session.id}
                                      className="text-sm flex justify-between items-center py-1"
                                    >
                                      <span>{session.title}</span>
                                      <span className="text-muted-foreground">
                                        {new Date(session.date).toLocaleDateString('cs-CZ')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Who Should Facilitate Next */}
            {statsWithoutFacilitation.length > 0 && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-primary">Kdo by měl facilitovat příště?</CardTitle>
                  <CardDescription>
                    Lidé, kteří ještě nefacilitovali TS v tomto období
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {statsWithoutFacilitation.map((stat) => (
                      <Badge key={stat.name} variant="outline" className="text-base py-1 px-3">
                        {stat.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
