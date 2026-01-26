-- Migration: Enforce single active session per user
-- This prevents multiple sessions from running simultaneously for the same user

-- 1. Remove the multi-tag unique constraint
ALTER TABLE active_sessions DROP CONSTRAINT IF EXISTS active_sessions_user_id_tag_id_key;

-- 2. Add a unique constraint on user_id only
-- If there are already multiple sessions, this might fail, so we should clean up first
DELETE FROM active_sessions 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY start_time DESC) as rn
    FROM active_sessions
  ) t WHERE rn = 1
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'active_sessions_user_id_key') THEN
        ALTER TABLE active_sessions ADD CONSTRAINT active_sessions_user_id_key UNIQUE (user_id);
    END IF;
END $$;
