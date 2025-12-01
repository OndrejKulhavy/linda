"use client"

import { useState, useMemo } from "react"
import { Treemap, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"

export interface UserProjectHours {
  name: string
  hours: number
  project: string
}

interface UserDetails {
  user: { id: string; name: string }
  projects: { name: string; hours: number }[]
  tasks: { description: string; project: string; hours: number; date: string }[]
  totalHours: number
}

interface TreemapChartProps {
  data: UserProjectHours[]
  dateRange?: { from: string; to: string }
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
  onUserClick?: (userName: string) => void
}

function CustomTreemapContent(props: TreemapNodeProps) {
  const { x, y, width, height, name, hours, color, onUserClick } = props

  if (width < 30 || height < 30) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onUserClick && name) {
      onUserClick(name)
    }
  }

  return (
    <g onClick={handleClick} style={{ cursor: "pointer" }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
        rx={4}
        className="transition-opacity hover:opacity-80"
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + 8}
            y={y + 20}
            fill="#fff"
            fontSize={width > 100 ? 14 : 11}
            fontWeight="500"
            style={{ pointerEvents: "none" }}
          >
            {name.length > width / 8 ? `${name.slice(0, Math.floor(width / 8))}...` : name}
          </text>
          <text
            x={x + 8}
            y={y + height - 10}
            fill="#fff"
            fontSize={width > 100 ? 24 : 16}
            fontWeight="bold"
            style={{ pointerEvents: "none" }}
          >
            {hours}
          </text>
        </>
      )}
    </g>
  )
}

export function UserHoursTreemap({ data, dateRange }: TreemapChartProps) {
  const projects = useMemo(() => {
    const projectSet = new Set(data.map((d) => d.project))
    return Array.from(projectSet)
  }, [data])

  const [activeProjects, setActiveProjects] = useState<Set<string>>(new Set(projects))
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleUserClick = async (userName: string) => {
    setSelectedUser(userName)
    setDialogOpen(true)
    setLoadingDetails(true)
    setUserDetails(null)

    try {
      const params = new URLSearchParams()
      if (dateRange?.from) params.set("from", dateRange.from)
      if (dateRange?.to) params.set("to", dateRange.to)
      params.set("userName", userName)

      const response = await fetch(`/api/clockify/users/details?${params.toString()}`)
      const result = await response.json()

      if (response.ok) {
        setUserDetails(result)
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

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
            className="cursor-pointer transition-all text-xs sm:text-sm py-1 px-2 sm:py-0.5 sm:px-2.5"
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

      <div className="w-full h-[300px] sm:h-[500px] bg-muted/20 rounded-lg p-2">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={filteredData}
              dataKey="hours"
              aspectRatio={4 / 3}
              stroke="#fff"
              animationDuration={300}
              content={
                <CustomTreemapContent 
                  x={0} 
                  y={0} 
                  width={0} 
                  height={0} 
                  name="" 
                  hours={0} 
                  color="" 
                  onUserClick={handleUserClick}
                />
              }
            >
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length > 0) {
                    const item = payload[0].payload
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-muted-foreground">{item.hours} hodin</p>
                        <p className="text-xs text-muted-foreground mt-1">Klikni pro detail</p>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedUser}</DialogTitle>
            <DialogDescription>
              {userDetails && `Celkem ${userDetails.totalHours} hodin`}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              {/* Pie Chart for Projects */}
              <div>
                <h3 className="text-sm font-medium mb-3">Projekty</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userDetails.projects}
                        dataKey="hours"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, hours }) => `${name}: ${hours}h`}
                        labelLine={false}
                      >
                        {userDetails.projects.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} hodin`, "Čas"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tasks List */}
              <div>
                <h3 className="text-sm font-medium mb-3">Úkoly ({userDetails.tasks.length})</h3>
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-4 space-y-3">
                    {userDetails.tasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-4 pb-3 border-b last:border-0 last:pb-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {task.project}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{task.date}</span>
                          </div>
                        </div>
                        <div className="text-sm font-semibold whitespace-nowrap">
                          {task.hours}h
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Nepodařilo se načíst data
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
