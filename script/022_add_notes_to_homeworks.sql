-- Add notes column to homeworks table if it does not already exist
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
