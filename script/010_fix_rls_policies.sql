-- 1. Enable public read access to profiles so display names can be retrieved by anyone
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- 2. Enable public read access to silmo_records so everyone can see the leaderboard scores
DROP POLICY IF EXISTS "Allow public read access to silmo_records" ON public.silmo_records;
CREATE POLICY "Allow public read access to silmo_records" 
ON public.silmo_records FOR SELECT 
USING (true);
