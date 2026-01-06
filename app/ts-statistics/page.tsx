'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'

interface RoleAssignment {
  role: string
  count: number
  sessions: Array<{
    date: string
    title: string
  }>
}

interface MemberStatistics {
  name: string
  roles: RoleAssignment[]
  totalAssignments: number
}

interface StatisticsResponse {
  statistics: MemberStatistics[]
  sessionCount: number
}

function getDefaultDateRange() {
  const today = new Date()
  const threeMonthsAgo = new Date(today)
  threeMonthsAgo.setMonth(today.getMonth() - 3)
  
  return {
    from: threeMonthsAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  }
}

export default function TSStatisticsPage() {
  const defaultRange = getDefaultDateRange()
  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<StatisticsResponse | null>(null)

  const fetchStatistics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/ts-statistics?startDate=${from}&endDate=${to}`
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Nepodařilo se načíst statistiky')
      }

      setData(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Došlo k chybě')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zpět
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              <h1 className="text-xl sm:text-2xl font-bold">TS Statistiky</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Date range filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <label htmlFor="from" className="text-sm text-muted-foreground min-w-7">
                  Od
                </label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="flex-1 sm:w-[140px] h-10 sm:h-9"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label htmlFor="to" className="text-sm text-muted-foreground min-w-7">
                  Do
                </label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex-1 sm:w-[140px] h-10 sm:h-9"
                />
              </div>
              <Button onClick={fetchStatistics} disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Načítám...
                  </>
                ) : (
                  'Načíst'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <>
            {/* Summary */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Analýza {data.sessionCount} TS v období od {new Date(from).toLocaleDateString('cs-CZ')} do {new Date(to).toLocaleDateString('cs-CZ')}
              </p>
            </div>

            {/* Statistics table */}
            <Card>
              <CardHeader>
                <CardTitle>Přehled rolí v TS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Člen týmu</TableHead>
                        <TableHead className="text-center">Celkem</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.statistics.map((member) => (
                        <TableRow key={member.name}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell className="text-center font-semibold">
                            {member.totalAssignments}
                          </TableCell>
                          <TableCell>
                            {member.roles.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {member.roles.map((role) => {
                                  const tooltipText = role.sessions.map(s => `${s.date}: ${s.title}`).join('\n')
                                  return (
                                    <span
                                      key={role.role}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
                                      title={tooltipText}
                                    >
                                      {role.role}: {role.count}x
                                    </span>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Žádné role</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Role breakdown */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Detailní rozpis rolí</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.statistics
                    .filter(member => member.totalAssignments > 0)
                    .map((member) => (
                      <div key={member.name} className="border-b pb-4 last:border-b-0">
                        <h3 className="font-semibold mb-2">
                          {member.name} ({member.totalAssignments} rolí)
                        </h3>
                        <div className="space-y-2 ml-4">
                          {member.roles.map((role) => (
                            <div key={role.role} className="text-sm">
                              <span className="font-medium">{role.role}</span> - {role.count}x
                              <div className="text-xs text-muted-foreground ml-4 mt-1">
                                {role.sessions.map((session, idx) => (
                                  <div key={idx}>
                                    {new Date(session.date).toLocaleDateString('cs-CZ')}: {session.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}
