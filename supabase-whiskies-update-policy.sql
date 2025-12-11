-- Add UPDATE policy for whiskies table
-- Run this SQL in your Supabase SQL Editor to enable whisky updates

CREATE POLICY "Enable update for all users" ON public.whiskies FOR UPDATE USING (true);

