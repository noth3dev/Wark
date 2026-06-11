-- Add double_choice_locked to silvival_rounds
ALTER TABLE public.silvival_rounds ADD COLUMN IF NOT EXISTS double_choice_locked BOOLEAN NOT NULL DEFAULT false;
-- Add winner_id to track who won each round for the choice modal
ALTER TABLE public.silvival_rounds ADD COLUMN IF NOT EXISTS winner_id TEXT;
