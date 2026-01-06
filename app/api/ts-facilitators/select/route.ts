import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { TEAM_MEMBERS, getFullName } from '@/lib/team-members'

interface FacilitatorWithWeight {
  name: string
  count: number
  daysSinceLastSession: number | null
  weight: number
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
 */
function parseFacilitators(description: string | null): string[] {
  if (!description) return []

  const facilitators: string[] = []
  const lines = description.split('\n')
  
  let inFacilitaceSection = false
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.toLowerCase() === 'facilitace') {
      inFacilitaceSection = true
      continue
    }
    
    if (inFacilitaceSection && (trimmedLine === '' || !trimmedLine.startsWith('-'))) {
      break
    }
    
    if (inFacilitaceSection && trimmedLine.startsWith('-')) {
      const name = trimmedLine.substring(1).trim()
      const normalizedName = normalizeString(name)
      
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

/**
 * Calculate weight for selection based on:
 * - Lower count = higher weight
 * - More days since last session = higher weight
 * - Add some randomness
 */
function calculateWeight(count: number, daysSinceLastSession: number | null, maxCount: number): number {
  // Base weight: inverse of count (people with 0 get max weight)
  const countWeight = maxCount === 0 ? 100 : (maxCount - count + 1) * 10
  
  // Time weight: more days = higher weight
  // If never facilitated, give a very high time weight (assume 1 year)
  const timeWeight = daysSinceLastSession === null ? 365 : Math.min(daysSinceLastSession, 365)
  
  // Combine weights (count is more important than time)
  const combinedWeight = (countWeight * 2) + timeWeight
  
  // Add 20% randomness
  const randomFactor = 0.8 + Math.random() * 0.4 // between 0.8 and 1.2
  
  return combinedWeight * randomFactor
}

/**
 * Select facilitators using weighted random selection
 */
function selectFacilitators(candidates: FacilitatorWithWeight[], count: number): string[] {
  const selected: string[] = []
  const remaining = [...candidates]
  
  for (let i = 0; i < count && remaining.length > 0; i++) {
    // Calculate total weight
    const totalWeight = remaining.reduce((sum, c) => sum + c.weight, 0)
    
    // Pick a random number between 0 and totalWeight
    let random = Math.random() * totalWeight
    
    // Find the selected person
    let selectedIndex = 0
    for (let j = 0; j < remaining.length; j++) {
      random -= remaining[j].weight
      if (random <= 0) {
        selectedIndex = j
        break
      }
    }
    
    selected.push(remaining[selectedIndex].name)
    remaining.splice(selectedIndex, 1)
  }
  
  return selected
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { startDate, endDate, count = 2 } = body

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
  const statsMap = new Map<string, { count: number; lastDate: string | null }>()
  TEAM_MEMBERS.forEach(member => {
    const fullName = getFullName(member)
    statsMap.set(fullName, { count: 0, lastDate: null })
  })

  // Parse facilitators from each session
  sessions?.forEach((session) => {
    const facilitators = parseFacilitators(session.description)
    
    facilitators.forEach(facilitatorName => {
      const stats = statsMap.get(facilitatorName)
      if (stats) {
        stats.count++
        // Update last date if this session is more recent
        if (!stats.lastDate || session.date > stats.lastDate) {
          stats.lastDate = session.date
        }
      }
    })
  })

  // Calculate weights for each person
  const now = new Date()
  const maxCount = Math.max(...Array.from(statsMap.values()).map(s => s.count))
  
  const candidates: FacilitatorWithWeight[] = Array.from(statsMap.entries()).map(([name, stats]) => {
    const daysSinceLastSession = stats.lastDate
      ? Math.floor((now.getTime() - new Date(stats.lastDate).getTime()) / (1000 * 60 * 60 * 24))
      : null
    
    return {
      name,
      count: stats.count,
      daysSinceLastSession,
      weight: calculateWeight(stats.count, daysSinceLastSession, maxCount),
    }
  })

  // Select facilitators
  const selected = selectFacilitators(candidates, Math.min(count, candidates.length))

  // Get full stats for selected people
  const selectedStats = candidates.filter(c => selected.includes(c.name))

  return NextResponse.json({
    selected,
    details: selectedStats.map(s => ({
      name: s.name,
      count: s.count,
      daysSinceLastSession: s.daysSinceLastSession,
      weight: Math.round(s.weight),
    })),
  })
}
