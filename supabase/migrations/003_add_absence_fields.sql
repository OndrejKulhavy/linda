-- Migration: Add absence tracking fields
-- Run this in Supabase SQL Editor

-- Add absence reason and excused fields to attendance_records
ALTER TABLE attendance_records 
  ADD COLUMN IF NOT EXISTS absence_reason TEXT,
  ADD COLUMN IF NOT EXISTS absence_excused BOOLEAN DEFAULT FALSE;

-- Add index for filtering by excused status
CREATE INDEX IF NOT EXISTS idx_attendance_excused ON attendance_records(absence_excused);
