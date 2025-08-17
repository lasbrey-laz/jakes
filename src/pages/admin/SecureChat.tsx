import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Shield, Crown, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../../components/CustomAlert';

export default function SecureChat() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile?.is_super_admin) {
        setCurrentUser(profile);
      } else {
        showGlobalError('Access denied. Only super admins can access secure chat.');
      }
    }
    setLoading(false);
  };

  if (!currentUser?.is_super_admin) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg">Access Denied</div>
        <p className="text-gray-400">Only super admins can access secure chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading secure chat...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-400" />
            Secure Chat
          </h1>
          <p className="text-gray-400">Communicate with customers and handle complaints</p>
        </div>
        <div className="flex items-center gap-2 text-yellow-400">
          <Crown className="w-5 h-5" />
          <span className="text-sm font-bold">SUPER ADMIN ACCESS</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-green-500 rounded-lg p-8 text-center">
        <MessageSquare className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Secure Chat System</h3>
        <p className="text-gray-400 mb-4">
          This feature allows super admins to communicate directly with customers
        </p>
        <p className="text-gray-500 text-sm">
          Chat functionality will be implemented in the next update
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
          <div>
            <h4 className="font-bold text-red-400 mb-2">Security Notice</h4>
            <p className="text-gray-300 text-sm">
              This is a secure communication channel for super admins only. All conversations are logged and monitored.
              Handle customer complaints professionally and maintain platform security standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
