"use client"

import { useState, useMemo } from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { Badge } from "@/components/ui/badge"

export interface UserProjectHours {
  name: string
  hours: number
  project: string
}

interface TreemapChartProps {
  data: UserProjectHours[]
}

const COLORS = [
  "#3b82f6", "#f97316", "#8b5cf6", "#ec4899", "#22c55e",
  "#ef4444", "#eab308", "#06b6d4", "#a855f7", "#f43f5e",
  "#84cc16", "#14b8a6", "#6366f1", "#d946ef", "#0ea5e9"
]

interface TreemapNodeProps {
  x: number
  y: number
  width: number
  height: number
  name: string
  hours: number
  color: string
}

function CustomTreemapContent(props: TreemapNodeProps) {
  const { x, y, width, height, name, hours, color } = props

  if (width < 30 || height < 30) return null

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
        rx={4}
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + 8}
            y={y + 20}
            fill="#fff"
            fontSize={width > 100 ? 14 : 11}
            fontWeight="500"
          >
            {name.length > width / 8 ? `${name.slice(0, Math.floor(width / 8))}...` : name}
          </text>
          <text
            x={x + 8}
            y={y + height - 10}
            fill="#fff"
            fontSize={width > 100 ? 24 : 16}
            fontWeight="bold"
          >
            {hours}
          </text>
        </>
      )}
    </g>
  )
}

export function UserHoursTreemap({ data }: TreemapChartProps) {
  const projects = useMemo(() => {
    const projectSet = new Set(data.map((d) => d.project))
    return Array.from(projectSet)
  }, [data])

  const [activeProjects, setActiveProjects] = useState<Set<string>>(new Set(projects))

  const toggleProject = (project: string) => {
    setActiveProjects((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(project)) {
        newSet.delete(project)
      } else {
        newSet.add(project)
      }
      return newSet
    })
  }

  const filteredData = useMemo(() => {
    const userHours = new Map<string, number>()

    for (const entry of data) {
      if (activeProjects.has(entry.project)) {
        userHours.set(entry.name, (userHours.get(entry.name) || 0) + entry.hours)
      }
    }

    return Array.from(userHours.entries())
      .map(([name, hours], index) => ({
        name,
        hours: Math.round(hours),
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.hours - a.hours)
  }, [data, activeProjects])

  const projectColors = useMemo(() => {
    const colors: Record<string, string> = {}
    projects.forEach((project, index) => {
      colors[project] = COLORS[index % COLORS.length]
    })
    return colors
  }, [projects])

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-4">
        {projects.map((project) => (
          <Badge
            key={project}
            variant={activeProjects.has(project) ? "default" : "outline"}
            className="cursor-pointer transition-all"
            style={{
              backgroundColor: activeProjects.has(project) ? projectColors[project] : "transparent",
              borderColor: projectColors[project],
              color: activeProjects.has(project) ? "#fff" : projectColors[project],
            }}
            onClick={() => toggleProject(project)}
          >
            {project}
          </Badge>
        ))}
      </div>

      <div className="w-full h-[500px] bg-muted/20 rounded-lg p-2">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={filteredData}
              dataKey="hours"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" hours={0} color="" />}
            >
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length > 0) {
                    const item = payload[0].payload
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-muted-foreground">{item.hours} hours</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select at least one project to view data
          </div>
        )}
      </div>
    </div>
  )
}
