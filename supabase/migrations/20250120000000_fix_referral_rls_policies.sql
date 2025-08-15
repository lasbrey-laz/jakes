-- Fix RLS policies for referral_codes table
-- Drop existing policies first
DROP POLICY IF EXISTS "Super admins can view all referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can view their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Super admins can insert referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can insert their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Super admins can update referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can update their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Super admins can delete referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can delete their own referral codes" ON public.referral_codes;

-- Create new policies with proper logic

-- SELECT policies
CREATE POLICY "Super admins can view all referral codes" ON public.referral_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

CREATE POLICY "Admins can view their own referral codes" ON public.referral_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        ) AND admin_id = auth.uid()
    );

-- INSERT policies
CREATE POLICY "Super admins can insert referral codes" ON public.referral_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

CREATE POLICY "Admins can insert their own referral codes" ON public.referral_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        ) AND admin_id = auth.uid()
    );

-- UPDATE policies
CREATE POLICY "Super admins can update referral codes" ON public.referral_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

CREATE POLICY "Admins can update their own referral codes" ON public.referral_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        ) AND admin_id = auth.uid()
    );

-- DELETE policies
CREATE POLICY "Super admins can delete referral codes" ON public.referral_codes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

CREATE POLICY "Admins can delete their own referral codes" ON public.referral_codes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        ) AND admin_id = auth.uid()
    );

-- Also fix the generate_referral_code function to avoid column ambiguity
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a random 8-character code
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists (use explicit table reference)
        IF NOT EXISTS (SELECT 1 FROM public.referral_codes rc WHERE rc.code = new_code) THEN
            RETURN new_code;
        END IF;
        
        -- Prevent infinite loop
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique referral code after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
