-- Migration to add super admin support and ensure proper RLS policies

-- First, ensure the is_super_admin column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_super_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update RLS policies for profiles table to support super admin functionality
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new policies that support super admin hierarchy
-- Super admins can view and update all profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Admins can view and update all profiles (but not super admin profiles)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

CREATE POLICY "Admins can update non-super-admin profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
        AND 
        NOT (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND is_super_admin = true
            )
        )
        OR
        (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
    );

-- Regular users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Insert policy for new users
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND is_super_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is admin or super admin
CREATE OR REPLACE FUNCTION is_admin_or_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND (is_admin = true OR is_super_admin = true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_super_admin(UUID) TO authenticated;

-- Ensure the profiles table has RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create an index on is_super_admin for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON public.profiles(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_vendor ON public.profiles(is_vendor);
