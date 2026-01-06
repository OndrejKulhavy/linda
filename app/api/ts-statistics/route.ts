import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { TEAM_MEMBERS, getFullName } from '@/lib/team-members'

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

// Parse description to extract roles and names
function parseDescription(description: string | null): Map<string, string[]> {
  const roleMap = new Map<string, string[]>()
  
  if (!description) return roleMap
  
  const lines = description.split('\n')
  let currentRole: string | null = null
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // Check if this is a role line (ends with : or doesn't start with -)
    if (trimmedLine.match(/^[^-].*:?\s*$/)) {
      // This looks like a role header
      currentRole = trimmedLine.replace(/:$/, '').trim()
      continue
    }
    
    // Check if this is a name line (starts with - or bullet point)
    if (currentRole && trimmedLine.match(/^[-•]\s*.+/)) {
      const name = trimmedLine.replace(/^[-•]\s*/, '').trim()
      
      if (!roleMap.has(currentRole)) {
        roleMap.set(currentRole, [])
      }
      roleMap.get(currentRole)!.push(name)
    }
  }
  
  return roleMap
}

// Match names from description with team members
function matchTeamMember(descriptionName: string): string | null {
  const normalizedDesc = descriptionName.toLowerCase().trim()
  
  for (const member of TEAM_MEMBERS) {
    const fullName = getFullName(member)
    const firstName = member.firstName.toLowerCase()
    const lastName = member.lastName.toLowerCase()
    
    // Check if description contains both first and last name
    if (normalizedDesc.includes(firstName) && normalizedDesc.includes(lastName)) {
      return fullName
    }
    
    // Check if it matches the full name format
    if (normalizedDesc === fullName.toLowerCase()) {
      return fullName
    }
  }
  
  return null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  
  try {
    // Fetch all TS sessions with descriptions
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('type', 'training_session')
      .eq('google_deleted', false)
      .order('date', { ascending: false })
    
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    
    const { data: sessions, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Build statistics map: member -> role -> assignments
    const memberStatsMap = new Map<string, Map<string, RoleAssignment>>()
    
    // Initialize map for all team members
    for (const member of TEAM_MEMBERS) {
      const fullName = getFullName(member)
      memberStatsMap.set(fullName, new Map())
    }
    
    // Process each session
    for (const session of sessions || []) {
      const roleMap = parseDescription(session.description)
      
      for (const [role, names] of roleMap.entries()) {
        for (const descName of names) {
          const matchedMember = matchTeamMember(descName)
          
          if (matchedMember) {
            const memberRoles = memberStatsMap.get(matchedMember)!
            
            if (!memberRoles.has(role)) {
              memberRoles.set(role, {
                role,
                count: 0,
                sessions: [],
              })
            }
            
            const roleAssignment = memberRoles.get(role)!
            roleAssignment.count++
            roleAssignment.sessions.push({
              date: session.date,
              title: session.title,
            })
          }
        }
      }
    }
    
    // Convert to array format
    const statistics: MemberStatistics[] = []
    
    for (const [name, roles] of memberStatsMap.entries()) {
      const rolesList = Array.from(roles.values())
      const totalAssignments = rolesList.reduce((sum, r) => sum + r.count, 0)
      
      statistics.push({
        name,
        roles: rolesList.sort((a, b) => b.count - a.count),
        totalAssignments,
      })
    }
    
    // Sort by total assignments descending
    statistics.sort((a, b) => b.totalAssignments - a.totalAssignments)
    
    return NextResponse.json({
      statistics,
      sessionCount: sessions?.length || 0,
    })
  } catch (error) {
    console.error('TS statistics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
