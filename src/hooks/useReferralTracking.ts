import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const useReferralTracking = () => {
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    
    if (ref && !isTracking) {
      trackReferralVisit(ref);
    }
  }, [searchParams, isTracking]);

  const trackReferralVisit = async (code: string) => {
    try {
      setIsTracking(true);
      
      // Get visitor IP (basic implementation - in production you might want to use a service)
      const visitorIP = await getVisitorIP();
      
      // Track the visit
      const { data, error } = await supabase
        .rpc('track_referral_visit', {
          p_code: code,
          p_visitor_ip: visitorIP,
          p_user_agent: navigator.userAgent
        });

      if (error) {
        console.error('Error tracking referral visit:', error);
        return;
      }

      // Check if the RPC function returned an error
      if (data && data.success === false) {
        console.error('Referral code not found or inactive:', code);
        return;
      }

      setReferralCode(code);
      
      // Store referral code in localStorage for later use (e.g., during signup)
      localStorage.setItem('referral_code', code);
      
    } catch (error) {
      console.error('Exception in trackReferralVisit:', error);
    } finally {
      setIsTracking(false);
    }
  };

  const markConversion = async (userId: string, conversionSource: string = 'signup') => {
    if (!referralCode) return;

    try {
      const { data, error } = await supabase
        .rpc('mark_referral_conversion', {
          p_code: referralCode,
          p_user_id: userId,
          p_conversion_source: conversionSource
        });

      if (error) {
        console.error('Error marking referral conversion:', error);
        return;
      }

      console.log('Referral conversion marked:', data);
      
      // Clear stored referral code after successful conversion
      localStorage.removeItem('referral_code');
      setReferralCode(null);
      
    } catch (error) {
      console.error('Error marking referral conversion:', error);
    }
  };

  const getStoredReferralCode = (): string | null => {
    return localStorage.getItem('referral_code');
  };

  const clearStoredReferralCode = () => {
    localStorage.removeItem('referral_code');
    setReferralCode(null);
  };

  return {
    referralCode,
    isTracking,
    trackReferralVisit,
    markConversion,
    getStoredReferralCode,
    clearStoredReferralCode
  };
};

// Basic IP detection - in production, you might want to use a service like ipapi.co
const getVisitorIP = async (): Promise<string | null> => {
  try {
    // Try to get IP from a public service
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Could not detect visitor IP:', error);
    return null;
  }
};
