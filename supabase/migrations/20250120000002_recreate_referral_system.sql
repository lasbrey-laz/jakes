-- Recreate the complete referral system
-- This migration creates all necessary tables, functions, and policies

-- 1. Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create referral_visits table
CREATE TABLE IF NOT EXISTS public.referral_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE CASCADE,
    visitor_ip INET,
    user_agent TEXT,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted_to_user BOOLEAN DEFAULT false,
    converted_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3. Create referral_conversions table
CREATE TABLE IF NOT EXISTS public.referral_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversion_source TEXT DEFAULT 'signup',
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on all tables
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can view referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can insert referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can update own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can delete own referral codes" ON public.referral_codes;

DROP POLICY IF EXISTS "Users can view referral visits" ON public.referral_visits;
DROP POLICY IF EXISTS "Users can insert referral visits" ON public.referral_visits;

DROP POLICY IF EXISTS "Users can view referral conversions" ON public.referral_conversions;
DROP POLICY IF EXISTS "Users can insert referral conversions" ON public.referral_conversions;

-- 6. Create RLS policies for referral_codes
CREATE POLICY "Users can view referral codes" ON public.referral_codes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert referral codes" ON public.referral_codes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own referral codes" ON public.referral_codes
    FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Users can delete own referral codes" ON public.referral_codes
    FOR DELETE USING (auth.uid() = admin_id);

-- 7. Create RLS policies for referral_visits
CREATE POLICY "Users can view referral visits" ON public.referral_visits
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert referral visits" ON public.referral_visits
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Create RLS policies for referral_conversions
CREATE POLICY "Users can view referral conversions" ON public.referral_conversions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert referral conversions" ON public.referral_conversions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 9. Create the generate_referral_code function
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

-- 10. Create the track_referral_visit function
CREATE OR REPLACE FUNCTION track_referral_visit(
    p_code VARCHAR(20),
    p_visitor_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_referral_code_id UUID;
    v_result JSONB;
BEGIN
    -- Find the referral code
    SELECT id INTO v_referral_code_id
    FROM public.referral_codes
    WHERE code = p_code AND is_active = true;
    
    IF v_referral_code_id IS NULL THEN
        RAISE EXCEPTION 'Referral code not found or inactive: %', p_code;
    END IF;
    
    -- Insert the visit
    INSERT INTO public.referral_visits (
        referral_code_id,
        visitor_ip,
        user_agent
    ) VALUES (
        v_referral_code_id,
        p_visitor_ip,
        p_user_agent
    );
    
    -- Return success result
    v_result := jsonb_build_object(
        'success', true,
        'referral_code_id', v_referral_code_id,
        'message', 'Visit tracked successfully'
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        v_result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 11. Create the mark_referral_conversion function
CREATE OR REPLACE FUNCTION mark_referral_conversion(
    p_code VARCHAR(20),
    p_user_id UUID,
    p_conversion_source TEXT DEFAULT 'signup'
)
RETURNS JSONB AS $$
DECLARE
    v_referral_code_id UUID;
    v_result JSONB;
BEGIN
    -- Find the referral code
    SELECT id INTO v_referral_code_id
    FROM public.referral_codes
    WHERE code = p_code AND is_active = true;
    
    IF v_referral_code_id IS NULL THEN
        RAISE EXCEPTION 'Referral code not found or inactive: %', p_code;
    END IF;
    
    -- Insert the conversion
    INSERT INTO public.referral_conversions (
        referral_code_id,
        user_id,
        conversion_source
    ) VALUES (
        v_referral_code_id,
        p_user_id,
        p_conversion_source
    );
    
    -- Update the visit to mark as converted
    UPDATE public.referral_visits
    SET converted_to_user = true, converted_user_id = p_user_id
    WHERE referral_code_id = v_referral_code_id
    AND converted_to_user = false;
    
    -- Return success result
    v_result := jsonb_build_object(
        'success', true,
        'referral_code_id', v_referral_code_id,
        'user_id', p_user_id,
        'message', 'Conversion marked successfully'
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        v_result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 12. Create updated_at trigger for referral_codes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_referral_codes_updated_at ON public.referral_codes;
CREATE TRIGGER update_referral_codes_updated_at
    BEFORE UPDATE ON public.referral_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_visits TO authenticated;
GRANT ALL ON public.referral_conversions TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION track_referral_visit(VARCHAR, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_referral_conversion(VARCHAR, UUID, TEXT) TO authenticated;
