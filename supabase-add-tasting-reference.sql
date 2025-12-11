-- Add tasting_reference field to whiskies table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.whiskies 
ADD COLUMN IF NOT EXISTS tasting_reference VARCHAR(500);

