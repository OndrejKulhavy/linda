-- Add new late tracking fields to attendance_records
-- late_start: was the person late at the beginning
-- late_break_count: how many times late after breaks

ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS late_start BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS late_break_count INTEGER DEFAULT 0;

-- Migrate existing data from late_type to new fields
UPDATE attendance_records 
SET late_start = TRUE 
WHERE late_type = 'start' OR status = 'late';

UPDATE attendance_records 
SET late_break_count = 1 
WHERE late_type = 'after_break';

-- Update status: 'late' should become 'present' (they were there, just late)
UPDATE attendance_records 
SET status = 'present' 
WHERE status = 'late';

-- Note: We keep late_type column for now for backwards compatibility
-- Can be dropped in a future migration after verifying all is working
