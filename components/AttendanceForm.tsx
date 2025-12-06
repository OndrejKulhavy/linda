'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AttendanceType } from '@/types/attendance'
import { TEAM_MEMBERS, getFullName } from '@/lib/team-members'

const ATTENDANCE_TYPES: AttendanceType[] = ['Training Session', 'Team Meeting']

export default function AttendanceForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<AttendanceType>('Training Session')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

  const toggleMember = (name: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(name)) {
      newSelected.delete(name)
    } else {
      newSelected.add(name)
    }
    setSelectedMembers(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedMembers.size === 0) {
      setError('Please select at least one team member')
      return
    }

    setLoading(true)
    setError(null)

    // Create one entry per selected member
    const entries = Array.from(selectedMembers).map(employee_name => ({
      date,
      employee_name,
      type,
    }))

    const response = await fetch('/api/attendance/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries }),
    })

    if (!response.ok) {
      const data = await response.json()
      setError(data.error || 'Failed to add attendance records')
      setLoading(false)
      return
    }

    router.push('/charts/late-arrivals')
    router.refresh()
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Add Late Arrivals</CardTitle>
        <CardDescription>Select team members who arrived late</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <RadioGroup value={type} onValueChange={(value) => setType(value as AttendanceType)}>
                {ATTENDANCE_TYPES.map((eventType) => (
                  <div key={eventType} className="flex items-center space-x-2">
                    <RadioGroupItem value={eventType} id={eventType} />
                    <Label htmlFor={eventType} className="font-normal cursor-pointer">
                      {eventType}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Team Members ({selectedMembers.size} selected)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border rounded-md p-4">
              {TEAM_MEMBERS.map((member) => {
                const fullName = getFullName(member)
                return (
                  <div key={fullName} className="flex items-center space-x-2">
                    <Checkbox
                      id={fullName}
                      checked={selectedMembers.has(fullName)}
                      onCheckedChange={() => toggleMember(fullName)}
                    />
                    <Label
                      htmlFor={fullName}
                      className="font-normal cursor-pointer flex-1"
                    >
                      {fullName}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : `Add ${selectedMembers.size} Record${selectedMembers.size !== 1 ? 's' : ''}`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/charts/late-arrivals')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
