-- Migration: Migrate existing attendance data to new structure
-- Run this AFTER the 001 migration and AFTER syncing Google Calendar events

-- This migration creates placeholder sessions for historical attendance data
-- and links existing attendance records to them

-- Step 1: Create placeholder sessions for each unique date+type combination
-- from the old attendance table (if it doesn't already exist from Google sync)

INSERT INTO sessions (google_event_id, title, type, date, start_time, end_time, google_deleted, synced_at)
SELECT DISTINCT
  'legacy_' || a.date || '_' || 
    CASE 
      WHEN a.type = 'Training Session' THEN 'training'
      ELSE 'meeting'
    END AS google_event_id,
  CASE 
    WHEN a.type = 'Training Session' THEN 'TS Legacy - ' || a.date
    ELSE 'TM Legacy - ' || a.date
  END AS title,
  CASE 
    WHEN a.type = 'Training Session' THEN 'training_session'
    ELSE 'team_meeting'
  END AS type,
  a.date::DATE AS date,
  CASE 
    WHEN a.type = 'Training Session' THEN '08:00'::TIME
    ELSE '10:00'::TIME
  END AS start_time,
  CASE 
    WHEN a.type = 'Training Session' THEN '12:00'::TIME
    ELSE '12:00'::TIME
  END AS end_time,
  false AS google_deleted,
  NOW() AS synced_at
FROM attendance a
WHERE NOT EXISTS (
  SELECT 1 FROM sessions s 
  WHERE s.date = a.date::DATE 
  AND s.type = CASE 
    WHEN a.type = 'Training Session' THEN 'training_session'
    ELSE 'team_meeting'
  END
)
ON CONFLICT (google_event_id) DO NOTHING;

-- Step 2: Migrate attendance records to the new structure
-- Linking them to the appropriate sessions

INSERT INTO attendance_records (session_id, employee_name, status, late_type, notes, created_by, created_at)
SELECT 
  s.id AS session_id,
  a.employee_name,
  'late' AS status,  -- All old records were late arrivals
  'start' AS late_type,  -- Assume late to start for legacy data
  'Migrated from legacy attendance table' AS notes,
  a.created_by,
  a.created_at
FROM attendance a
JOIN sessions s ON s.date = a.date::DATE 
  AND s.type = CASE 
    WHEN a.type = 'Training Session' THEN 'training_session'
    ELSE 'team_meeting'
  END
ON CONFLICT (session_id, employee_name) DO NOTHING;

-- Optional: After verifying the migration, you can rename or archive the old table
-- ALTER TABLE attendance RENAME TO attendance_legacy;
