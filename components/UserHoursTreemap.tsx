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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import { FolderKanban, ListTodo, ExternalLink, AlertTriangle } from "lucide-react"

export interface UserProjectHours {
  name: string
  hours: number
  project: string
}

interface UserDetails {
  user: { id: string; name: string }
  projects: { name: string; hours: number }[]
  tasks: { description: string; project: string; task: string | null; hours: number; date: string }[]
  totalHours: number
}

interface TreemapChartProps {
  data: UserProjectHours[]
  dateRange?: { from: string; to: string }
  highlight40Hours?: boolean
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
  highlight40Hours?: boolean
}

function CustomTreemapContent(props: TreemapNodeProps) {
  const { x, y, width, height, name, hours, color, onUserClick, highlight40Hours = false } = props

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onUserClick && name) {
      onUserClick(name)
    }
  }

  // More aggressive text display - show on smaller blocks
  const showText = width > 45 && height > 30
  const showOnlyHours = !showText && width > 30 && height > 25
  const isBelow40 = hours < 40 && highlight40Hours
  const showAlertIcon = isBelow40 && width > 60 && height > 40

  return (
    <g onClick={handleClick} style={{ cursor: "pointer" }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isBelow40 ? "#6b7280" : color}
        stroke="#fff"
        strokeWidth={2}
        rx={4}
        className="transition-opacity hover:opacity-80"
      />
      {showAlertIcon && (
        <g transform={`translate(${x + width - 22}, ${y + 6})`}>
          <circle cx="10" cy="10" r="9" fill="#ef4444" opacity="0.9" />
          <path
            d="M10 6 L10 11 M10 13 L10 14"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      )}
      {showText && (
        <>
          <text
            x={x + 6}
            y={y + 16}
            fill="#fff"
            fontSize={width > 100 ? 14 : width > 70 ? 12 : 10}
            fontWeight="500"
            style={{ pointerEvents: "none" }}
          >
            {name.length > width / 7 ? `${name.slice(0, Math.floor(width / 7))}...` : name}
          </text>
          <text
            x={x + 6}
            y={y + height - 8}
            fill="#fff"
            fontSize={width > 100 ? 22 : width > 70 ? 18 : 14}
            fontWeight="bold"
            style={{ pointerEvents: "none" }}
          >
            {hours}
          </text>
        </>
      )}
      {showOnlyHours && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 5}
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
          textAnchor="middle"
          style={{ pointerEvents: "none" }}
        >
          {hours}
        </text>
      )}
    </g>
  )
}

export function UserHoursTreemap({ data, dateRange, highlight40Hours = false }: TreemapChartProps) {
  const isMobile = useIsMobile()
  const projects = useMemo(() => {
    const projectSet = new Set(data.map((d) => d.project))
    return Array.from(projectSet)
  }, [data])

  const defaultActiveProjects = useMemo(() => {
    const allowedProjects = new Set(["Practice", "Reading", "Training"])
    return new Set(projects.filter((p) => allowedProjects.has(p)))
  }, [projects])

  const [activeProjects, setActiveProjects] = useState<Set<string>>(defaultActiveProjects)
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

  // Group tasks by date (show all tasks)
  const groupedTasks = useMemo(() => {
    if (!userDetails) return []
    const grouped = new Map<string, typeof userDetails.tasks>()
    for (const task of userDetails.tasks) {
      const date = task.date
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date)!.push(task)
    }
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [userDetails])

  const UserDetailsContent = () => {
    if (loadingDetails) {
      return (
        <div className="flex items-center justify-center py-16">
          <Spinner className="w-10 h-10" />
        </div>
      )
    }

    if (!userDetails) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">Nepodařilo se načíst data</p>
        </div>
      )
    }

    // Generate Clockify URL for the user
    const clockifyUrl = dateRange?.from && dateRange?.to && userDetails.user.id
      ? `https://app.clockify.me/reports/summary?start=${dateRange.from}T00:00:00.000Z&end=${dateRange.to}T23:59:59.999Z&filterValuesData=${encodeURIComponent(JSON.stringify({ users: [userDetails.user.id], userGroups: [], userAndGroup: [] }))}&filterOptions=${encodeURIComponent(JSON.stringify({ userAndGroup: { status: "ACTIVE_WITH_PENDING" } }))}`
      : null

    return (
      <div className="space-y-6">
        {clockifyUrl && (
          <a
            href={clockifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Zobrazit v Clockify
          </a>
        )}

        {/* Projects Distribution */}
        <div>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <FolderKanban className="w-4 h-4" />
            Distribuce podle projektů
          </h3>
          <div className="h-[280px] bg-muted/30 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDetails.projects}
                  dataKey="hours"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 70 : 90}
                  label={({ name, hours }) => `${name}: ${hours}h`}
                  labelLine={false}
                >
                  {userDetails.projects.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} hodin`, "Čas"]} />
                <Legend 
                  wrapperStyle={{ fontSize: isMobile ? "12px" : "14px" }}
                  iconSize={isMobile ? 10 : 14}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Separator />

        {/* Tasks List */}
        <div>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            Časové záznamy ({userDetails.tasks.length})
          </h3>
          {userDetails.tasks.length > 0 ? (
            <div className="space-y-4">
              {groupedTasks.map(([date, tasks]) => (
                <div key={date} className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide sticky top-0 bg-background/95 backdrop-blur py-1 z-10">
                    {new Date(date).toLocaleDateString("cs-CZ", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  {tasks.map((task, index) => (
                    <div
                      key={`${date}-${index}`}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-md border hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: `${projectColors[task.project]}15`,
                        borderColor: `${projectColors[task.project]}40`,
                      }}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-tight">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal py-0 h-5"
                            style={{
                              backgroundColor: projectColors[task.project],
                              color: "#fff",
                            }}
                          >
                            {task.project}
                          </Badge>
                          {task.task && (
                            <span className="text-xs text-muted-foreground">
                              • {task.task}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-bold whitespace-nowrap text-primary">
                        {task.hours}h
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg border bg-muted/30 text-muted-foreground">
              <ListTodo className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm text-center">Žádné časové záznamy</p>
            </div>
          )}
        </div>
      </div>
    )
  }

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

      <div className="w-full h-[500px] bg-muted/20 rounded-lg p-2">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={filteredData}
              dataKey="hours"
              aspectRatio={isMobile ? 1 / 1.5 : 4 / 3}
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
                  highlight40Hours={highlight40Hours}
                />
              }
            >
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length > 0) {
                    const item = payload[0].payload
                    const isBelow40 = item.hours < 40 && highlight40Hours
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{item.name}</p>
                          {isBelow40 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        </div>
                        <p className="text-muted-foreground">{item.hours} hodin</p>
                        {isBelow40 && (
                          <p className="text-xs text-red-500 mt-1">Nedosaženo 40 hodin</p>
                        )}
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

      {isMobile ? (
        <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left pb-4">
              <DrawerTitle className="text-xl">{selectedUser}</DrawerTitle>
              {userDetails && (
                <DrawerDescription className="text-sm">
                  Přehled odpracovaného času
                </DrawerDescription>
              )}
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              <UserDetailsContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl">{selectedUser}</DialogTitle>
              {userDetails && (
                <DialogDescription className="text-base">
                  Přehled odpracovaného času za vybrané období
                </DialogDescription>
              )}
            </DialogHeader>
            <UserDetailsContent />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
