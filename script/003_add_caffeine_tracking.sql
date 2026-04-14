-- Caffeine Intake Tracking
CREATE TABLE caffeine_intake (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount FLOAT NOT NULL, -- in mg
    intake_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE caffeine_intake ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own caffeine intake"
    ON caffeine_intake FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own caffeine intake"
    ON caffeine_intake FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caffeine intake"
    ON caffeine_intake FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caffeine intake"
    ON caffeine_intake FOR DELETE
    USING (auth.uid() = user_id);
