-- Migration: Add MS Teams excuse URL field
-- Run this in Supabase SQL Editor

-- Add Teams URL field to attendance_records for linking to excuse comments
ALTER TABLE attendance_records 
  ADD COLUMN IF NOT EXISTS excuse_teams_url TEXT;

