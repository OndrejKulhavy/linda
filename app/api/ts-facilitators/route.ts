import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { TEAM_MEMBERS, getFullName } from '@/lib/team-members'

interface FacilitatorStats {
  name: string
  count: number
  sessions: Array<{
    id: string
    title: string
    date: string
  }>
}

/**
 * Normalize string by removing diacritics for comparison
 */
function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Parses facilitators from event description
 * Expected format:
 * Facilitace
 * - Vrbas Matěj
 * - Kmetíková Aneta
 * - Hodek Matyáš
 */
function parseFacilitators(description: string | null): string[] {
  if (!description) return []

  const facilitators: string[] = []
  const lines = description.split('\n')
  
  let inFacilitaceSection = false
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Check if we're entering the Facilitace section
    if (trimmedLine.toLowerCase() === 'facilitace') {
      inFacilitaceSection = true
      continue
    }
    
    // If we're in the section and hit an empty line or another section, stop
    if (inFacilitaceSection && (trimmedLine === '' || !trimmedLine.startsWith('-'))) {
      break
    }
    
    // Parse facilitator names
    if (inFacilitaceSection && trimmedLine.startsWith('-')) {
      const name = trimmedLine.substring(1).trim()
      const normalizedName = normalizeString(name)
      
      // Try to match against team members
      // The format might be "Vrbas Matěj", "Matěj Vrbas", "Hodek Matyáš", etc.
      const matchedMember = TEAM_MEMBERS.find(member => {
        const fullName = getFullName(member)
        const reversedName = `${member.lastName} ${member.firstName}`
        
        const normalizedFullName = normalizeString(fullName)
        const normalizedReversedName = normalizeString(reversedName)
        
        return normalizedName === normalizedFullName || 
               normalizedName === normalizedReversedName
      })
      
      if (matchedMember) {
        facilitators.push(getFullName(matchedMember))
      }
    }
  }
  
  return facilitators
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // Fetch all TS (training_session) events
  let query = supabase
    .from('sessions')
    .select('id, title, description, date, type')
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

  // Initialize stats map with all team members
  const statsMap = new Map<string, FacilitatorStats>()
  TEAM_MEMBERS.forEach(member => {
    const fullName = getFullName(member)
    statsMap.set(fullName, {
      name: fullName,
      count: 0,
      sessions: [],
    })
  })

  // Parse facilitators from each session
  sessions?.forEach((session) => {
    const facilitators = parseFacilitators(session.description)
    
    facilitators.forEach(facilitatorName => {
      const stats = statsMap.get(facilitatorName)
      if (stats) {
        stats.count++
        stats.sessions.push({
          id: session.id,
          title: session.title,
          date: session.date,
        })
      }
    })
  })

  // Convert map to array and sort by count (descending)
  const statistics = Array.from(statsMap.values())
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    statistics,
    totalSessions: sessions?.length || 0,
    dateRange: {
      start: startDate,
      end: endDate,
    },
  })
}
