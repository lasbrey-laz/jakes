-- Migration to add country field to profiles table for vendor country filtering

-- Add country column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country VARCHAR(2);

-- Create index on country for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);

-- Update RLS policies to allow public access to country field for vendor filtering
-- This allows users to see vendor countries without authentication
DROP POLICY IF EXISTS "Public can view vendor countries" ON public.profiles;

CREATE POLICY "Public can view vendor countries" ON public.profiles
    FOR SELECT USING (
        is_vendor = true AND is_active = true AND vendor_status = 'approved'
    );

-- Add comment to the country column
COMMENT ON COLUMN public.profiles.country IS 'ISO 3166-1 alpha-2 country code for vendor location';
