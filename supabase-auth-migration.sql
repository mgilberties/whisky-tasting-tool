-- Authentication and User Accounts Migration
-- Run this SQL in your Supabase SQL Editor to enable user accounts

-- Add user_id columns to existing tables
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create session_invitations table for email invitations
CREATE TABLE IF NOT EXISTS public.session_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(session_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_host_user_id ON public.sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_invitations_session_id ON public.session_invitations(session_id);
CREATE INDEX IF NOT EXISTS idx_session_invitations_email ON public.session_invitations(email);

-- Enable RLS for session_invitations
ALTER TABLE public.session_invitations ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for sessions
-- Drop old policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sessions;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.sessions;
DROP POLICY IF EXISTS "Enable update for all users" ON public.sessions;

-- Allow reading sessions by code (for anonymous participants)
CREATE POLICY "Anyone can view sessions by code" ON public.sessions 
    FOR SELECT USING (true);

-- Authenticated users can view their own hosted sessions
CREATE POLICY "Users can view their own sessions" ON public.sessions 
    FOR SELECT USING (auth.uid() = host_user_id);

-- Authenticated users can view sessions they're participating in
CREATE POLICY "Users can view sessions they're participating in" ON public.sessions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.participants 
            WHERE session_id = sessions.id 
            AND user_id = auth.uid()
        )
    );

-- Only authenticated users can create sessions (hosts must be logged in)
CREATE POLICY "Authenticated users can create sessions" ON public.sessions 
    FOR INSERT WITH CHECK (auth.uid() = host_user_id);

-- Only hosts can update their sessions
CREATE POLICY "Users can update their own sessions" ON public.sessions 
    FOR UPDATE USING (auth.uid() = host_user_id);

-- Update RLS policies for participants
DROP POLICY IF EXISTS "Enable read access for all users" ON public.participants;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.participants;

-- Allow viewing participants in any session (for anonymous access)
CREATE POLICY "Anyone can view participants" ON public.participants 
    FOR SELECT USING (true);

-- Allow anyone to join sessions (anonymous or authenticated)
CREATE POLICY "Anyone can join sessions" ON public.participants 
    FOR INSERT WITH CHECK (true);

-- Authenticated users can join with their user_id
CREATE POLICY "Authenticated users can join with user_id" ON public.participants 
    FOR INSERT WITH CHECK (
        user_id IS NULL OR auth.uid() = user_id
    );

-- Update RLS policies for whiskies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.whiskies;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.whiskies;
DROP POLICY IF EXISTS "Enable update for all users" ON public.whiskies;

-- Allow viewing whiskies in any session (for anonymous participants)
CREATE POLICY "Anyone can view whiskies" ON public.whiskies 
    FOR SELECT USING (true);

-- Only hosts can manage whiskies (must be authenticated)
CREATE POLICY "Hosts can manage whiskies in their sessions" ON public.whiskies 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessions 
            WHERE sessions.id = whiskies.session_id 
            AND sessions.host_user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can update whiskies in their sessions" ON public.whiskies 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.sessions 
            WHERE sessions.id = whiskies.session_id 
            AND sessions.host_user_id = auth.uid()
        )
    );

-- Update RLS policies for submissions
DROP POLICY IF EXISTS "Enable read access for all users" ON public.submissions;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.submissions;
DROP POLICY IF EXISTS "Enable update for all users" ON public.submissions;

-- Hosts can view all submissions in their sessions
CREATE POLICY "Hosts can view submissions in their sessions" ON public.submissions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sessions 
            WHERE sessions.id = submissions.session_id 
            AND sessions.host_user_id = auth.uid()
        )
    );

-- Participants can view their own submissions (authenticated or by participant_id)
CREATE POLICY "Participants can view their own submissions" ON public.submissions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.participants 
            WHERE participants.id = submissions.participant_id 
            AND (participants.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Anyone can create submissions (for anonymous participants)
CREATE POLICY "Anyone can create submissions" ON public.submissions 
    FOR INSERT WITH CHECK (true);

-- Participants can update their own submissions
CREATE POLICY "Participants can update their own submissions" ON public.submissions 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.participants 
            WHERE participants.id = submissions.participant_id 
            AND (participants.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Policies for session_invitations
CREATE POLICY "Users can view invitations sent to them" ON public.session_invitations 
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Hosts can view invitations for their sessions" ON public.session_invitations 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sessions 
            WHERE sessions.id = session_invitations.session_id 
            AND sessions.host_user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can create invitations" ON public.session_invitations 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessions 
            WHERE sessions.id = session_invitations.session_id 
            AND sessions.host_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own invitations" ON public.session_invitations 
    FOR UPDATE USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

