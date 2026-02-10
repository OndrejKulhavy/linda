/**
 * Test file for the timezone fix
 * This verifies that the formatDateForClockify function correctly converts
 * Czech local time to UTC for Clockify API calls.
 */

import { formatDateForClockify } from '../utils/clockify'

describe('formatDateForClockify', () => {
  describe('Winter time (CET = UTC+1)', () => {
    test('converts start of Monday in February correctly', () => {
      const result = formatDateForClockify('2026-02-09', false)
      // Monday Feb 9, 00:00 CET should be Sunday Feb 8, 23:00 UTC
      expect(result).toBe('2026-02-08T23:00:00.000Z')
    })

    test('converts end of Sunday in February correctly', () => {
      const result = formatDateForClockify('2026-02-15', true)
      // Sunday Feb 15, 23:59:59 CET should be Sunday Feb 15, 22:59:59 UTC
      expect(result).toBe('2026-02-15T22:59:59.999Z')
    })

    test('handles week boundary correctly', () => {
      const weekStart = formatDateForClockify('2026-02-09', false)
      const weekEnd = formatDateForClockify('2026-02-15', true)
      
      // Verify it includes the full week in Czech time
      expect(weekStart).toBe('2026-02-08T23:00:00.000Z')
      expect(weekEnd).toBe('2026-02-15T22:59:59.999Z')
      
      // The UTC timestamps should span from Sunday 23:00 to next Sunday 22:59
      const startDate = new Date(weekStart)
      const endDate = new Date(weekEnd)
      
      expect(startDate.getUTCDay()).toBe(0) // Sunday
      expect(endDate.getUTCDay()).toBe(0) // Sunday
    })
  })

  describe('Summer time (CEST = UTC+2)', () => {
    test('converts start of day in July correctly', () => {
      const result = formatDateForClockify('2026-07-15', false)
      // July 15, 00:00 CEST should be July 14, 22:00 UTC
      expect(result).toBe('2026-07-14T22:00:00.000Z')
    })

    test('converts end of day in July correctly', () => {
      const result = formatDateForClockify('2026-07-15', true)
      // July 15, 23:59:59 CEST should be July 15, 21:59:59 UTC
      expect(result).toBe('2026-07-15T21:59:59.999Z')
    })
  })

  describe('DST transitions', () => {
    test('handles date before DST start correctly', () => {
      // March 28, 2026 is the last Sunday of March (DST starts)
      // March 27 should still be CET (UTC+1)
      const result = formatDateForClockify('2026-03-27', false)
      expect(result).toBe('2026-03-26T23:00:00.000Z')
    })

    test('handles date after DST start correctly', () => {
      // March 30 should be CEST (UTC+2)
      const result = formatDateForClockify('2026-03-30', false)
      expect(result).toBe('2026-03-29T22:00:00.000Z')
    })

    test('handles date before DST end correctly', () => {
      // October 24, 2026 should be CEST (UTC+2)
      const result = formatDateForClockify('2026-10-24', false)
      expect(result).toBe('2026-10-23T22:00:00.000Z')
    })

    test('handles date after DST end correctly', () => {
      // October 26, 2026 (after last Sunday) should be CET (UTC+1)
      const result = formatDateForClockify('2026-10-26', false)
      expect(result).toBe('2026-10-25T23:00:00.000Z')
    })
  })

  describe('Real-world scenario', () => {
    test('February 2026 week - the original bug', () => {
      // User selects week: Monday Feb 9 - Sunday Feb 15, 2026
      // They expect to see ALL entries logged during this week in Czech time
      
      const weekStart = formatDateForClockify('2026-02-09', false)
      const weekEnd = formatDateForClockify('2026-02-15', true)
      
      // Old (buggy) behavior would use:
      // start=2026-02-09T00:00:00Z (misses first hour of Monday in Czech time)
      // end=2026-02-15T23:59:59Z (includes first hour of next Monday in Czech time)
      
      // New (correct) behavior:
      expect(weekStart).toBe('2026-02-08T23:00:00.000Z')
      expect(weekEnd).toBe('2026-02-15T22:59:59.999Z')
      
      // This ensures the API returns entries from:
      // Monday Feb 9, 00:00 CET to Sunday Feb 15, 23:59:59 CET
    })
  })
})
