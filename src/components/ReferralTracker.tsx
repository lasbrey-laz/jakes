import React from 'react';
import { useReferralTracking } from '../hooks/useReferralTracking';

export default function ReferralTracker() {
  // Initialize referral tracking - this component is rendered inside Router context
  useReferralTracking();
  
  // This component doesn't render anything visible
  return null;
}
