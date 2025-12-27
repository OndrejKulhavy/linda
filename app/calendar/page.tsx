'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, RefreshCw, Loader2, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SessionCalendar from '@/components/SessionCalendar'
import QuickAttendancePanel from '@/components/QuickAttendancePanel'
import AttendanceSummary from '@/components/AttendanceSummary'
import type { SessionWithAttendance } from '@/types/session'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

export default function CalendarPage() {
  const [sessions, setSessions] = useState<SessionWithAttendance[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionWithAttendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nepodařilo se načíst události')
      }

      setSessions(data.sessions || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Došlo k chybě')
    } finally {
      setLoading(false)
    }
  }, [])

  const syncWithGoogleCalendar = useCallback(async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Synchronizace selhala')
      }

      if (data.skipped) {
        toast.info('Synchronizace přeskočena - poslední byla před méně než 5 minutami')
      } else {
        toast.success(
          `Synchronizováno: ${data.result?.synced || 0} událostí ` +
          `(${data.result?.created || 0} nových, ${data.result?.updated || 0} aktualizovaných)`
        )
      }

      setLastSyncAt(data.syncedAt || data.lastSyncAt)
      await fetchSessions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Synchronizace selhala')
    } finally {
      setSyncing(false)
    }
  }, [fetchSessions])

  // Initial load: sync and fetch
  useEffect(() => {
    const initialize = async () => {
      if (isLoggedIn) {
        await syncWithGoogleCalendar()
      } else {
        await fetchSessions()
      }
    }
    initialize()
  }, [isLoggedIn, syncWithGoogleCalendar, fetchSessions])

  const handleSessionClick = (session: SessionWithAttendance) => {
    setSelectedSession(session)
  }

  const handlePanelClose = () => {
    setSelectedSession(null)
  }

  const handleAttendanceSave = async () => {
    toast.success('Docházka uložena')
    await fetchSessions()
    // Refresh selected session
    if (selectedSession) {
      const updated = sessions.find(s => s.id === selectedSession.id)
      if (updated) {
        setSelectedSession(updated)
      }
    }
  }

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('cs-CZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Zpět</span>
              </Button>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold">Kalendář</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {lastSyncAt && (
              <span className="hidden sm:inline text-sm text-muted-foreground">
                Sync: {formatLastSync(lastSyncAt)}
              </span>
            )}
            {isLoggedIn && (
              <Link href="/attendance">
                <Button variant="outline" size="sm" className="px-2 sm:px-3">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Statistiky</span>
                </Button>
              </Link>
            )}
            {isLoggedIn && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncWithGoogleCalendar}
                disabled={syncing}
                className="px-2 sm:px-3"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-2">Sync</span>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Main content */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar */}
            <div className={selectedSession ? 'lg:flex-1' : 'w-full'}>
              <SessionCalendar
                sessions={sessions}
                onSessionClick={handleSessionClick}
                selectedSessionId={selectedSession?.id}
              />
            </div>

            {/* Desktop: Side panel */}
            {selectedSession && (
              <div className="hidden lg:block w-96 shrink-0">
                <div className="sticky top-6">
                  {isLoggedIn ? (
                    <QuickAttendancePanel
                      session={selectedSession}
                      onClose={handlePanelClose}
                      onSave={handleAttendanceSave}
                    />
                  ) : (
                    <AttendanceSummary
                      session={selectedSession}
                      onClose={handlePanelClose}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Mobile: Bottom sheet */}
            <Sheet open={!!selectedSession && isMobile} onOpenChange={(open) => !open && handlePanelClose()}>
              <SheetContent side="bottom" className="h-[85vh] p-0">
                <SheetTitle className="sr-only">
                  {selectedSession?.title || 'Docházka'}
                </SheetTitle>
                {selectedSession && (
                  isLoggedIn ? (
                    <QuickAttendancePanel
                      session={selectedSession}
                      onClose={handlePanelClose}
                      onSave={handleAttendanceSave}
                    />
                  ) : (
                    <AttendanceSummary
                      session={selectedSession}
                      onClose={handlePanelClose}
                    />
                  )
                )}
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Info for non-logged in users */}
        {!isLoggedIn && !loading && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Pro úpravu docházky a synchronizaci s Google Calendar se{' '}
              <Link href="/auth/login" className="text-primary underline">
                přihlaste
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
