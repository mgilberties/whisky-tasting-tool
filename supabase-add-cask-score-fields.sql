-- Add cask_type and host_score fields to whiskies table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.whiskies 
ADD COLUMN IF NOT EXISTS cask_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS host_score INTEGER CHECK (host_score >= 0 AND host_score <= 5);

