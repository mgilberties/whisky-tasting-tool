-- Whisky Tasting Tool Database Schema
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(6) NOT NULL UNIQUE,
    host_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'collecting', 'reviewing', 'revealed', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table
CREATE TABLE public.participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Whiskies table
CREATE TABLE public.whiskies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    abv DECIMAL(4,1) NOT NULL,
    region VARCHAR(255) NOT NULL,
    distillery VARCHAR(255) NOT NULL,
    category VARCHAR(255) DEFAULT '',
    bottling_type VARCHAR(2) DEFAULT 'OB' CHECK (bottling_type IN ('IB', 'OB')),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE public.submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    whisky_id UUID NOT NULL REFERENCES public.whiskies(id) ON DELETE CASCADE,
    guessed_name VARCHAR(255) NOT NULL,
    guessed_score INTEGER NOT NULL CHECK (guessed_score >= 0 AND guessed_score <= 5),
    guessed_age INTEGER,
    guessed_abv DECIMAL(4,1) NOT NULL,
    guessed_region VARCHAR(255) NOT NULL,
    guessed_distillery VARCHAR(255) NOT NULL,
    guessed_category VARCHAR(255) DEFAULT '',
    guessed_bottling_type VARCHAR(2) DEFAULT 'OB' CHECK (guessed_bottling_type IN ('IB', 'OB')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, whisky_id)
);

-- Create indexes for better performance
CREATE INDEX idx_sessions_code ON public.sessions(code);
CREATE INDEX idx_participants_session_id ON public.participants(session_id);
CREATE INDEX idx_whiskies_session_id ON public.whiskies(session_id);
CREATE INDEX idx_whiskies_order ON public.whiskies(session_id, order_index);
CREATE INDEX idx_submissions_session_id ON public.submissions(session_id);
CREATE INDEX idx_submissions_participant_id ON public.submissions(participant_id);
CREATE INDEX idx_submissions_whisky_id ON public.submissions(whisky_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiskies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a simple app without authentication)
-- Note: In production, you might want more restrictive policies

-- Sessions policies
CREATE POLICY "Enable read access for all users" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.sessions FOR UPDATE USING (true);

-- Participants policies
CREATE POLICY "Enable read access for all users" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.participants FOR INSERT WITH CHECK (true);

-- Whiskies policies
CREATE POLICY "Enable read access for all users" ON public.whiskies FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.whiskies FOR INSERT WITH CHECK (true);

-- Submissions policies
CREATE POLICY "Enable read access for all users" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.submissions FOR UPDATE USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update timestamps
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Keep-alive table to prevent Supabase project from pausing due to inactivity
-- This table is used by the /api/keep-alive endpoint which runs on a cron schedule
CREATE TABLE public.keep_alive (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name TEXT NULL DEFAULT '',
    random UUID NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some placeholder data for the keep-alive queries
INSERT INTO public.keep_alive(name) VALUES
    ('placeholder'),
    ('example'),
    ('keep-alive');

-- Enable RLS for keep_alive table
ALTER TABLE public.keep_alive ENABLE ROW LEVEL SECURITY;

-- Create policy for keep_alive table (read-only for keep-alive functionality)
CREATE POLICY "Enable read access for all users" ON public.keep_alive FOR SELECT USING (true);
