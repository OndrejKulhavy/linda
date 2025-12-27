// Czech public holidays
// Returns true if the given date is a Czech public holiday

function getEasterSunday(year: number): Date {
  // Anonymous Gregorian algorithm for Easter
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function getGoodFriday(year: number): Date {
  const easter = getEasterSunday(year)
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  return goodFriday
}

function getEasterMonday(year: number): Date {
  const easter = getEasterSunday(year)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)
  return easterMonday
}

export function getCzechHolidays(year: number): Date[] {
  return [
    new Date(year, 0, 1),   // Nový rok (1.1.)
    getGoodFriday(year),     // Velký pátek
    getEasterMonday(year),   // Velikonoční pondělí
    new Date(year, 4, 1),   // Svátek práce (1.5.)
    new Date(year, 4, 8),   // Den vítězství (8.5.)
    new Date(year, 6, 5),   // Cyril a Metoděj (5.7.)
    new Date(year, 6, 6),   // Jan Hus (6.7.)
    new Date(year, 8, 28),  // Den české státnosti (28.9.)
    new Date(year, 9, 28),  // Vznik Československa (28.10.)
    new Date(year, 10, 17), // Den boje za svobodu (17.11.)
    new Date(year, 11, 24), // Štědrý den (24.12.)
    new Date(year, 11, 25), // 1. svátek vánoční (25.12.)
    new Date(year, 11, 26), // 2. svátek vánoční (26.12.)
  ]
}

export function isHoliday(date: Date): boolean {
  const holidays = getCzechHolidays(date.getFullYear())
  return holidays.some(
    (holiday) =>
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear()
  )
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isWorkingDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date)
}

export function getWorkingDaysInRange(from: Date, to: Date): number {
  let count = 0
  const current = new Date(from)
  
  while (current <= to) {
    if (isWorkingDay(current)) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

export function getHolidaysInRange(from: Date, to: Date): { date: Date; name: string }[] {
  const holidayNames: Record<string, string> = {
    "1-1": "Nový rok",
    "5-1": "Svátek práce",
    "5-8": "Den vítězství",
    "7-5": "Cyril a Metoděj",
    "7-6": "Jan Hus",
    "9-28": "Den české státnosti",
    "10-28": "Vznik Československa",
    "11-17": "Den boje za svobodu",
    "12-24": "Štědrý den",
    "12-25": "1. svátek vánoční",
    "12-26": "2. svátek vánoční",
  }

  const result: { date: Date; name: string }[] = []
  const current = new Date(from)

  while (current <= to) {
    if (isHoliday(current) && !isWeekend(current)) {
      const key = `${current.getMonth() + 1}-${current.getDate()}`
      let name = holidayNames[key]
      
      // Check for Easter holidays
      if (!name) {
        const year = current.getFullYear()
        const goodFriday = getGoodFriday(year)
        const easterMonday = getEasterMonday(year)
        
        if (current.getTime() === goodFriday.getTime()) {
          name = "Velký pátek"
        } else if (current.getTime() === easterMonday.getTime()) {
          name = "Velikonoční pondělí"
        }
      }
      
      result.push({ date: new Date(current), name: name || "Svátek" })
    }
    current.setDate(current.getDate() + 1)
  }

  return result
}

// Standard 8 hours per working day, 40 hours for full week
export const HOURS_PER_DAY = 8
export const FULL_WEEK_HOURS = 40

export function calculateExpectedHours(from: Date, to: Date): {
  workingDays: number
  expectedHours: number
  holidays: { date: Date; name: string }[]
} {
  const workingDays = getWorkingDaysInRange(from, to)
  const holidays = getHolidaysInRange(from, to)
  const expectedHours = workingDays * HOURS_PER_DAY

  return {
    workingDays,
    expectedHours,
    holidays,
  }
}
