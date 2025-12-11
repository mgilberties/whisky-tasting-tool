-- Add whiskybase_link field to whiskies table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.whiskies 
ADD COLUMN IF NOT EXISTS whiskybase_link VARCHAR(500);

