-- Whisky Tasting Tool Database Migration
-- Run this SQL in your Supabase SQL Editor to update scoring from 1-10 to 0-5

-- First, if you already have the tables and want to keep existing data, run this:
-- (If you haven't run the schema yet, just run the full supabase-schema.sql instead)

-- Update the check constraint for scoring to be 0-5 instead of 1-10
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_guessed_score_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_guessed_score_check CHECK (guessed_score >= 0 AND guessed_score <= 5);

-- If you have existing data with scores > 5, you might want to scale them down:
-- UPDATE public.submissions SET guessed_score = ROUND(guessed_score / 2.0, 1) WHERE guessed_score > 5;

-- Enable realtime for all tables (this ensures real-time subscriptions work properly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiskies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
