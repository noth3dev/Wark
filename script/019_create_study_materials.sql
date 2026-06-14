-- Create study_materials table to track user materials per subject
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    last_amount_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, subject_tag_id, name)
);

-- RLS Policies
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study materials"
    ON public.study_materials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study materials"
    ON public.study_materials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study materials"
    ON public.study_materials FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study materials"
    ON public.study_materials FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_study_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_study_materials_updated_at_trigger
BEFORE UPDATE ON public.study_materials
FOR EACH ROW
EXECUTE FUNCTION update_study_materials_updated_at();
