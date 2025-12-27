-- Migration: Create sessions and attendance_records tables
-- Run this in your Supabase SQL Editor

-- Sessions table: Local cache of Google Calendar events
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_event_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('training_session', 'team_meeting')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  google_deleted BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance records table: Tracks attendance per session per employee
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent_planned', 'absent_unplanned')),
  late_type TEXT CHECK (late_type IS NULL OR late_type IN ('start', 'after_break')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, employee_name)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_google_event_id ON sessions(google_event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_records(employee_name);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
-- Anyone can read sessions
CREATE POLICY "Sessions are viewable by everyone" ON sessions
  FOR SELECT USING (true);

-- Only authenticated users can insert/update sessions
CREATE POLICY "Authenticated users can insert sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sessions" ON sessions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for attendance_records
-- Anyone can read attendance records
CREATE POLICY "Attendance records are viewable by everyone" ON attendance_records
  FOR SELECT USING (true);

-- Only authenticated users can insert attendance records
CREATE POLICY "Authenticated users can insert attendance records" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update attendance records
CREATE POLICY "Authenticated users can update attendance records" ON attendance_records
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Only authenticated users can delete attendance records
CREATE POLICY "Authenticated users can delete attendance records" ON attendance_records
  FOR DELETE USING (auth.uid() IS NOT NULL);
