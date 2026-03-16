-- Add is_sprint column to study_sessions table
ALTER TABLE study_sessions ADD COLUMN is_sprint BOOLEAN DEFAULT FALSE;
