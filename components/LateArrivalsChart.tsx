'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface AttendanceRecord {
  employee_name: string
  type: string
  date: string
  created_at: string
}

interface LateArrivalData {
  name: string
  count: number
  trainingCount: number
  meetingCount: number
  records: AttendanceRecord[]
}

interface LateArrivalsChartProps {
  data: LateArrivalData[]
}

export default function LateArrivalsChart({ data }: LateArrivalsChartProps) {
  const [selectedPerson, setSelectedPerson] = useState<LateArrivalData | null>(null)
  const chartConfig = {
    count: {
      label: 'Pozdní příchody',
      color: 'hsl(var(--chart-1))',
    },
    trainingCount: {
      label: 'Tréninky',
      color: 'hsl(220 70% 75%)',
    },
    meetingCount: {
      label: 'Týmové meetingy',
      color: 'hsl(280 65% 78%)',
    },
  }

  // Sort by total count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }

  const getTypeLabel = (type: string) => {
    if (type === 'Training Session') return 'Training Session'
    if (type === 'Team Meeting') return 'Týmový meeting'
    return type
  }

  const getTypeBadgeVariant = (type: string): "default" | "secondary" => {
    if (type === 'Training Session') return 'default'
    return 'secondary'
  }

  return (
    <>
      <Dialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPerson?.name}</DialogTitle>
            <DialogDescription>
              Celkem {selectedPerson?.count} pozdní{selectedPerson?.count === 1 ? 'ho příchodu' : 'ch příchodů'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selectedPerson?.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{formatDate(record.date)}</div>
                    <div className="text-xs text-muted-foreground">Čas: {formatTime(record.created_at)}</div>
                  </div>
                  <Badge variant={getTypeBadgeVariant(record.type)} className="text-xs">
                    {getTypeLabel(record.type)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
      <CardHeader>
        <CardTitle>Pozdní příchody tento měsíc</CardTitle>
        <CardDescription>Počet pozdních příchodů podle člena týmu</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Tento měsíc nejsou zaznamenány žádné pozdní příchody
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart 
              data={sortedData} 
              margin={{ left: 0, right: 0, top: 0, bottom: 60 }}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const clickedData = e.activePayload[0].payload as LateArrivalData
                  setSelectedPerson(clickedData)
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="trainingCount"
                stackId="a"
                fill="var(--color-trainingCount)"
                radius={[0, 0, 4, 4]}
                cursor="pointer"
              />
              <Bar
                dataKey="meetingCount"
                stackId="a"
                fill="var(--color-meetingCount)"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
              />
            </BarChart>
          </ChartContainer>
        )}
        
        {sortedData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/40 rounded-lg">
              <div className="text-2xl font-bold">
                {sortedData.reduce((sum, d) => sum + d.count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Celkem pozdních příchodů</div>
            </div>
            <div className="text-center p-4 bg-muted/40 rounded-lg">
              <div className="text-2xl font-bold">
                {sortedData.reduce((sum, d) => sum + d.trainingCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">TS</div>
            </div>
            <div className="text-center p-4 bg-muted/40 rounded-lg">
              <div className="text-2xl font-bold">
                {sortedData.reduce((sum, d) => sum + d.meetingCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">TM</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  )
}
