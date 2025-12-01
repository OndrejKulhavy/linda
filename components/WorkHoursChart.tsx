"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export interface WorkHoursData {
  date: string
  weekLabel: string
  hours: number
  goal: number
}

interface WorkHoursChartProps {
  data: WorkHoursData[]
  totalHours: number
  totalGoal: number
}

export function WorkHoursChart({ data, totalHours, totalGoal }: WorkHoursChartProps) {
  const percentComplete = Math.round((totalHours / totalGoal) * 100)

  return (
    <div>
      <div className="flex gap-6 mb-6">
        <div className="flex-1 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-muted-foreground">Odpracováno</p>
          <p className="text-3xl font-bold text-blue-500">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="flex-1 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-muted-foreground">Cíl</p>
          <p className="text-3xl font-bold text-green-500">{totalGoal.toFixed(1)}h</p>
        </div>
        <div className={`flex-1 p-4 rounded-lg ${percentComplete >= 100 ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'} border`}>
          <p className="text-sm text-muted-foreground">Plnění</p>
          <p className={`text-3xl font-bold ${percentComplete >= 100 ? 'text-green-500' : 'text-orange-500'}`}>{percentComplete}%</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="weekLabel"
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af" }}
            label={{ value: "Hodiny", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#f3f4f6",
            }}
            labelFormatter={(label) => `Týden: ${label}`}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} hodin`,
              name === "hours" ? "Odpracováno" : "Cíl",
            ]}
          />
          <Legend
            formatter={(value) => (value === "hours" ? "Odpracováno" : "Týdenní cíl")}
          />
          <Line
            type="monotone"
            dataKey="goal"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#60a5fa" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
