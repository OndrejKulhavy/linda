'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SessionCalendar from '@/components/SessionCalendar'
import SessionAttendancePanel from '@/components/SessionAttendancePanel'
import type { SessionWithAttendance } from '@/types/session'
import { toast } from 'sonner'

export default function CalendarPage() {
  const [sessions, setSessions] = useState<SessionWithAttendance[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionWithAttendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zpět
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Kalendář událostí</h1>
          </div>
          <div className="flex items-center gap-2">
            {lastSyncAt && (
              <span className="text-sm text-muted-foreground">
                Poslední sync: {formatLastSync(lastSyncAt)}
              </span>
            )}
            {isLoggedIn && (
              <Button
                variant="outline"
                onClick={syncWithGoogleCalendar}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Synchronizovat
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className={selectedSession ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <SessionCalendar
                sessions={sessions}
                onSessionClick={handleSessionClick}
                selectedSessionId={selectedSession?.id}
              />
            </div>

            {/* Attendance Panel */}
            {selectedSession && (
              <div className="lg:col-span-1">
                <SessionAttendancePanel
                  session={selectedSession}
                  onClose={handlePanelClose}
                  onSave={handleAttendanceSave}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            )}
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
