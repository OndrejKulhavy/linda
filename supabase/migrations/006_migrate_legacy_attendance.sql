-- Migration: Migrate legacy attendance to new attendance_records
-- Run this in Supabase SQL Editor

-- The legacy attendance table recorded LATE arrivals
-- MULTIPLE records per person per session possible:
--   - One for being late at start (created within 15 min of session start)
--   - Multiple for being late after breaks (created more than 15 min after start)
-- 
-- We aggregate these into a single attendance_record with:
--   - late_start = true if ANY record was within 15 min of start
--   - late_break_count = count of records created more than 15 min after start

-- Step 1: Migrate legacy attendance to attendance_records (aggregated)
INSERT INTO public.attendance_records (
  session_id,
  employee_name,
  status,
  late_type,
  notes,
  created_by,
  created_at,
  absence_excused,
  late_start,
  late_break_count
)
SELECT 
  s.id as session_id,
  a.employee_name,
  'present' as status,
  -- Legacy late_type: 'start' if any early record exists, else 'after_break'
  CASE 
    WHEN bool_or(EXTRACT(EPOCH FROM (a.created_at - (s.date + s.start_time))) / 60 <= 15)
    THEN 'start'
    ELSE 'after_break'
  END as late_type,
  'Migrated from legacy attendance (' || COUNT(*)::text || ' records)' as notes,
  (array_agg(a.created_by))[1] as created_by,  -- Take first created_by
  MIN(a.created_at) as created_at,  -- Earliest record timestamp
  false as absence_excused,
  -- late_start = true if ANY record was within 15 min of session start
  bool_or(EXTRACT(EPOCH FROM (a.created_at - (s.date + s.start_time))) / 60 <= 15) as late_start,
  -- late_break_count = count of records MORE than 15 min after session start
  COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (a.created_at - (s.date + s.start_time))) / 60 > 15) as late_break_count
FROM public.attendance a
INNER JOIN public.sessions s ON 
  s.date = a.date 
  AND (
    (a.type = 'Training Session' AND s.type = 'training_session')
    OR (a.type = 'Team Meeting' AND s.type = 'team_meeting')
  )
GROUP BY s.id, a.employee_name
ON CONFLICT (session_id, employee_name) DO NOTHING;

-- Step 2: Check results - see what was migrated and how it was classified
-- SELECT 
--   a.date, 
--   a.employee_name, 
--   a.type as legacy_type,
--   a.created_at,
--   s.start_time,
--   ROUND(EXTRACT(EPOCH FROM (a.created_at - (s.date + s.start_time))) / 60) as minutes_after_start,
--   ar.late_start,
--   ar.late_break_count,
--   s.title
-- FROM public.attendance a
-- INNER JOIN public.sessions s ON s.date = a.date
-- LEFT JOIN public.attendance_records ar ON ar.session_id = s.id AND ar.employee_name = a.employee_name
-- ORDER BY a.date DESC;

-- Step 3: Check for orphaned legacy records (dates without sessions)
-- SELECT DISTINCT a.date, a.type, COUNT(*) as record_count
-- FROM public.attendance a
-- LEFT JOIN public.sessions s ON 
--   s.date = a.date 
--   AND (
--     (a.type = 'Training Session' AND s.type = 'training_session')
--     OR (a.type = 'Team Meeting' AND s.type = 'team_meeting')
--   )
-- WHERE s.id IS NULL
-- GROUP BY a.date, a.type
-- ORDER BY a.date;

-- Step 4: After verifying migration is correct, you can optionally drop the old table
-- DROP TABLE public.attendance;

