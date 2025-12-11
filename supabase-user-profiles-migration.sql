-- User Profiles Migration
-- Adds ability to lock/disable user accounts
-- Run this SQL in your Supabase SQL Editor

-- Create user_profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_disabled BOOLEAN DEFAULT FALSE,
    disabled_at TIMESTAMP WITH TIME ZONE,
    disabled_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_disabled ON public.user_profiles(is_disabled);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view all profiles (for admin purposes)" ON public.user_profiles 
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.user_profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to sync email updates
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_profiles
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync email updates
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.handle_user_email_update();

-- Helper function to disable a user account
CREATE OR REPLACE FUNCTION public.disable_user_account(user_id UUID, disabled_by_user_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        is_disabled = TRUE,
        disabled_at = NOW(),
        disabled_by = disabled_by_user_id,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to enable a user account
CREATE OR REPLACE FUNCTION public.enable_user_account(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        is_disabled = FALSE,
        disabled_at = NULL,
        disabled_by = NULL,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

