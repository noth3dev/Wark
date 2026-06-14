-- Ensure tags table has icon column
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Cpu';

-- Drop existing tag_groups table to recreate it with the correct global constraints
DROP TABLE IF EXISTS tag_groups CASCADE;

-- Create global tag_groups table
CREATE TABLE tag_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT tag_groups_icon_key UNIQUE(icon)
);

-- Enable RLS
ALTER TABLE tag_groups ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
DROP POLICY IF EXISTS "Allow read access for all users" ON tag_groups;
CREATE POLICY "Allow read access for all users" ON tag_groups
    FOR SELECT TO authenticated USING (true);

-- Allow write access to authenticated users if they customize group names (global)
DROP POLICY IF EXISTS "Allow write access for all users" ON tag_groups;
CREATE POLICY "Allow write access for all users" ON tag_groups
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default global tag groups
INSERT INTO public.tag_groups (name, color, icon) VALUES
    ('자습', '#c084fc', 'Book'),
    ('학교', '#2dd4bf', 'Briefcase'),
    ('휴식', '#fb923c', 'Coffee')
ON CONFLICT (icon) DO UPDATE 
SET name = EXCLUDED.name, color = EXCLUDED.color;
