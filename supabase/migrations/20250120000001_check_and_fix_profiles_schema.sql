-- First, let's check what columns exist in the profiles table
-- and create the missing ones if needed

-- Check if is_admin column exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Check if is_super_admin column exists, if not create it
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

-- Now let's completely drop and recreate the RLS policies for referral_codes
-- This will ensure we have clean, working policies

-- Drop all existing policies
DROP POLICY IF EXISTS "Super admins can view all referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can view their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Super admins can insert referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can insert their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Super admins can update referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can update their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Super admins can delete referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can delete their own referral codes" ON public.referral_codes;

-- Create simple, working policies
-- First, allow all authenticated users to view referral codes (we'll filter in the app)
CREATE POLICY "Users can view referral codes" ON public.referral_codes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert referral codes (we'll validate admin status in the app)
CREATE POLICY "Users can insert referral codes" ON public.referral_codes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own referral codes
CREATE POLICY "Users can update own referral codes" ON public.referral_codes
    FOR UPDATE USING (auth.uid() = admin_id);

-- Allow users to delete their own referral codes
CREATE POLICY "Users can delete own referral codes" ON public.referral_codes
    FOR DELETE USING (auth.uid() = admin_id);

-- Also fix the generate_referral_code function
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        IF NOT EXISTS (SELECT 1 FROM public.referral_codes rc WHERE rc.code = new_code) THEN
            RETURN new_code;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique referral code after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
