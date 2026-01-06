-- Migration: Add description field to sessions table
-- This will store the event description from Google Calendar

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for searching descriptions
CREATE INDEX IF NOT EXISTS idx_sessions_description ON sessions USING gin(to_tsvector('simple', description));
