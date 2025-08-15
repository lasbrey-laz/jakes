import React, { useState, useEffect } from 'react';
import { Link, Copy, Plus, Trash2, BarChart3, Users, Eye, UserCheck, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../../components/CustomAlert';

interface ReferralCode {
  id: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ReferralVisit {
  id: string;
  visitor_ip: string;
  user_agent: string;
  visited_at: string;
  converted_to_user: boolean;
  converted_user_id: string | null;
}

interface ReferralConversion {
  id: string;
  user_id: string;
  conversion_source: string;
  converted_at: string;
}

export default function AdminReferrals() {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [visits, setVisits] = useState<ReferralVisit[]>([]);
  const [conversions, setConversions] = useState<ReferralConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState({ description: '' });
  const [creating, setCreating] = useState(false);
  const [selectedCode, setSelectedCode] = useState<ReferralCode | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch referral codes
      const { data: codesData, error: codesError } = await supabase
        .from('referral_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      // Fetch visits for all codes
      const { data: visitsData, error: visitsError } = await supabase
        .from('referral_visits')
        .select('*')
        .order('visited_at', { ascending: false });

      if (visitsError) throw visitsError;

      // Fetch conversions for all codes
      const { data: conversionsData, error: conversionsError } = await supabase
        .from('referral_conversions')
        .select('*')
        .order('converted_at', { ascending: false });

      if (conversionsError) throw conversionsError;

      setReferralCodes(codesData || []);
      setVisits(visitsData || []);
      setConversions(conversionsData || []);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      showGlobalError('Error fetching referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.description.trim()) {
      showGlobalError('Please enter a description for the referral code');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .rpc('generate_referral_code');

      if (error) throw error;

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: insertData, error: insertError } = await supabase
        .from('referral_codes')
        .insert([{
          code: data,
          description: newCode.description.trim(),
          admin_id: user.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setReferralCodes([insertData, ...referralCodes]);
      setNewCode({ description: '' });
      setShowCreateModal(false);
      showGlobalSuccess('Referral code created successfully!');
    } catch (error) {
      console.error('Error creating referral code:', error);
      showGlobalError('Error creating referral code');
    } finally {
      setCreating(false);
    }
  };

  const toggleCodeStatus = async (code: ReferralCode) => {
    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({ is_active: !code.is_active })
        .eq('id', code.id);

      if (error) throw error;

      setReferralCodes(referralCodes.map(c => 
        c.id === code.id ? { ...c, is_active: !c.is_active } : c
      ));
      showGlobalSuccess(`Referral code ${code.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error updating referral code:', error);
      showGlobalError('Error updating referral code');
    }
  };

  const deleteCode = async (code: ReferralCode) => {
    if (!confirm(`Are you sure you want to delete referral code "${code.code}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('referral_codes')
        .delete()
        .eq('id', code.id);

      if (error) throw error;

      setReferralCodes(referralCodes.filter(c => c.id !== code.id));
      showGlobalSuccess('Referral code deleted successfully');
    } catch (error) {
      console.error('Error deleting referral code:', error);
      showGlobalError('Error deleting referral code');
    }
  };

  const copyToClipboard = async (text: string, type: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      const message = type === 'code' 
        ? `Referral code "${text}" copied to clipboard!` 
        : `Full URL copied to clipboard!`;
      showGlobalSuccess(message);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      const message = type === 'code' 
        ? `Referral code "${text}" copied to clipboard!` 
        : `Full URL copied to clipboard!`;
      showGlobalSuccess(message);
    }
  };

  const getReferralStats = (codeId: string) => {
    const codeVisits = visits.filter(v => v.referral_code_id === codeId);
    const codeConversions = conversions.filter(c => c.referral_code_id === codeId);
    const conversionRate = codeVisits.length > 0 ? (codeConversions.length / codeVisits.length * 100).toFixed(1) : '0';
    
    return {
      totalVisits: codeVisits.length,
      totalConversions: codeConversions.length,
      conversionRate: `${conversionRate}%`
    };
  };

  const getFullReferralUrl = (code: string) => {
    // Use the actual domain from the current location
    const currentOrigin = window.location.origin;
    return `${currentOrigin}?ref=${code}`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading referral data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Link className="w-6 h-6" />
            Referral Management
          </h1>
          <p className="text-gray-400">Track how users discover your marketplace</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Code
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      {showAnalytics && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-3 rounded-full">
                <Link className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Codes</p>
                <p className="text-2xl font-bold text-white">{referralCodes.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-blue-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-full">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Visits</p>
                <p className="text-2xl font-bold text-white">{visits.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-yellow-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-600 p-3 rounded-full">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Conversions</p>
                <p className="text-2xl font-bold text-white">{conversions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-purple-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Avg Conversion</p>
                <p className="text-2xl font-bold text-white">
                  {visits.length > 0 ? (conversions.length / visits.length * 100).toFixed(1) : '0'}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Options Info */}
      <div className="bg-gray-900 border border-blue-500 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Copy className="w-5 h-5 text-blue-400" />
          <h3 className="text-blue-400 font-semibold">Copy Options</h3>
        </div>
        <div className="text-sm text-gray-300 space-y-1">
          <p>• <strong>Copy Code:</strong> Copies just the referral code (e.g., "ABC123")</p>
          <p>• <strong>Copy URL:</strong> Copies the full website URL with referral code (e.g., "https://yoursite.com?ref=ABC123")</p>
        </div>
      </div>

      {/* Referral Codes Table */}
      <div className="bg-gray-900 border border-green-500 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-green-400 font-bold">Code & Copy</th>
                <th className="text-left p-4 text-green-400 font-bold">Description & Full URL</th>
                <th className="text-left p-4 text-green-400 font-bold">Status</th>
                <th className="text-left p-4 text-green-400 font-bold">Stats</th>
                <th className="text-left p-4 text-green-400 font-bold">Created</th>
                <th className="text-left p-4 text-green-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {referralCodes.map((code) => {
                const stats = getReferralStats(code.id);
                return (
                  <tr key={code.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-blue-400">{code.code}</span>
                        <button
                          onClick={() => copyToClipboard(code.code, 'code')}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Copy referral code only"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <span className="text-white">{code.description}</span>
                        <div className="text-xs text-gray-400 font-mono">
                          {getFullReferralUrl(code.code)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        code.is_active 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {code.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="w-3 h-3 text-blue-400" />
                          <span className="text-gray-300">{stats.totalVisits} visits</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <UserCheck className="w-3 h-3 text-green-400" />
                          <span className="text-gray-300">{stats.totalConversions} conversions</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {stats.conversionRate} conversion rate
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-400 text-sm">
                        {new Date(code.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(getFullReferralUrl(code.code), 'url')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-2"
                          title="Copy full URL with referral code"
                        >
                          <Copy className="w-3 h-4" />
                          Copy URL
                        </button>
                        <button
                          onClick={() => toggleCodeStatus(code)}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            code.is_active
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {code.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                        </button>
                        <button
                          onClick={() => deleteCode(code)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {referralCodes.length === 0 && (
        <div className="text-center py-12">
          <Link className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No referral codes created yet</p>
          <p className="text-gray-500">Create your first referral code to start tracking</p>
        </div>
      )}

      {/* Create Referral Code Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Create New Referral Code</h3>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm mb-2">Description</label>
                <input
                  type="text"
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  placeholder="e.g., Social Media Campaign, Email Newsletter, etc."
                  required
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-6 py-3 rounded font-bold transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
