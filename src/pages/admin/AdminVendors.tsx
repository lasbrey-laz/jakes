import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit, Trash2, Shield, Star, Clock, CheckCircle, XCircle, User, Mail, Key } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { useAlert } from '../../components/CustomAlert';

export default function AdminVendors() {
  const { showSuccess, showError, showWarning } = useAlert();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchCreateModal, setShowBatchCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchVendors, setBatchVendors] = useState('');
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [newVendor, setNewVendor] = useState({
    email: '',
    password: '',
    username: '',
    vendor_type: 'escrow',
    is_verified: false
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_vendor', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVendorStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ vendor_status: status })
        .eq('id', id);

      if (error) throw error;
      fetchVendors();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      showError('Error updating vendor status');
    }
  };

  const deleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) return;

    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_vendor: false, vendor_status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      showError('Error deleting vendor');
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
          if (!newVendor.email || !newVendor.password || !newVendor.username) {
        showError('Please fill in all required fields');
        return;
      }

    setCreating(true);
    try {
      // Create auth user using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newVendor.email,
        password: newVendor.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create profile using admin client to bypass RLS
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: authData.user.id,
          username: newVendor.username,
          email: newVendor.email,
          is_vendor: true,
          is_admin: false,
          vendor_status: 'approved',
          vendor_type: newVendor.vendor_type,
          is_verified: newVendor.is_verified,
          is_active: true,
          reputation_score: 0.0,
          total_sales: 0,
          disputes_won: 0,
          disputes_lost: 0,
          open_orders: 0
        }]);

      if (profileError) throw profileError;

      setNewVendor({ email: '', password: '', username: '', vendor_type: 'escrow', is_verified: false });
      setShowCreateModal(false);
      fetchVendors();
      showSuccess('Vendor created successfully!');
    } catch (error) {
      console.error('Error creating vendor:', error);
      showError('Error creating vendor: ' + (error as any).message);
    } finally {
      setCreating(false);
    }
  };

  const handleBatchCreateVendors = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchVendors.trim()) {
      showError('Please enter vendor data');
      return;
    }

    setBatchCreating(true);
    setBatchResults([]);
    
    const lines = batchVendors.trim().split('\n');
    const results: any[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split(',').map(part => part.trim());
      if (parts.length < 3) {
        results.push({
          email: parts[0] || 'Unknown',
          status: 'error',
          message: 'Invalid format - need at least email, username, password'
        });
        continue;
      }

      const [email, username, password, vendorType = 'escrow', isVerifiedStr = 'false'] = parts;
      const isVerified = isVerifiedStr.toLowerCase() === 'true';

      try {
        // Create auth user using admin client
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (authError) throw authError;

        // Create profile using admin client to bypass RLS
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([{
            id: authData.user.id,
            username,
            email,
            is_vendor: true,
            is_admin: false,
            vendor_status: 'approved',
            vendor_type: vendorType,
            is_verified: isVerified,
            is_active: true,
            reputation_score: 0.0,
            total_sales: 0,
            disputes_won: 0,
            disputes_lost: 0,
            open_orders: 0
          }]);

        if (profileError) throw profileError;

        results.push({
          email,
          status: 'success',
          message: 'Vendor created successfully'
        });
      } catch (error) {
        results.push({
          email,
          status: 'error',
          message: (error as any).message
        });
      }
    }

    setBatchResults(results);
    setBatchCreating(false);
    fetchVendors();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      case 'suspended': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'suspended': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    if (filter === 'all') return true;
    return vendor.vendor_status === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            Vendors Management
          </h1>
          <p className="text-gray-400">Manage vendor applications and accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Vendor
        </button>
        <button
          onClick={() => setShowBatchCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Batch Create
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
        <div className="flex gap-4">
          {['all', 'pending', 'approved', 'rejected', 'suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                filter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-green-400'
              }`}
            >
              {status.toUpperCase()}
              {status === 'all' && (
                <span className="ml-2 bg-gray-600 px-2 py-1 rounded text-xs">
                  {vendors.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-gray-900 border border-green-500 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-green-400 font-bold">Vendor</th>
                <th className="text-left p-4 text-green-400 font-bold">Email</th>
                <th className="text-left p-4 text-green-400 font-bold">Reputation</th>
                <th className="text-left p-4 text-green-400 font-bold">Join Date</th>
                <th className="text-left p-4 text-green-400 font-bold">Status</th>
                <th className="text-left p-4 text-green-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">{vendor.username}</div>
                        {vendor.is_verified && (
                          <div className="flex items-center gap-1 text-blue-400 text-xs">
                            <Shield className="w-3 h-3" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-green-400">{vendor.email}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-yellow-400 font-bold">
                        {vendor.reputation_score?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-white">
                    {new Date(vendor.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-2 ${getStatusColor(vendor.vendor_status || 'pending')}`}>
                      {getStatusIcon(vendor.vendor_status || 'pending')}
                      <span className="font-bold text-sm">
                        {(vendor.vendor_status || 'pending').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {vendor.vendor_status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateVendorStatus(vendor.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => updateVendorStatus(vendor.id, 'rejected')}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                          >
                            REJECT
                          </button>
                        </>
                      )}
                      {vendor.vendor_status === 'approved' && (
                        <button
                          onClick={() => updateVendorStatus(vendor.id, 'suspended')}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                          SUSPEND
                        </button>
                      )}
                      {vendor.vendor_status === 'suspended' && (
                        <button
                          onClick={() => updateVendorStatus(vendor.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                          REACTIVATE
                        </button>
                      )}
                      <button
                        onClick={() => deleteVendor(vendor.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No vendors found</p>
          <p className="text-gray-500">
            {filter === 'all' ? 'No vendor applications yet' : `No ${filter} vendors`}
          </p>
        </div>
      )}

      {/* Create Vendor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Create New Vendor</h3>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    required
                    className="w-full bg-black border border-gray-600 text-green-400 pl-10 pr-4 py-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="vendor@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-green-400 text-sm mb-2">Username *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={newVendor.username}
                    onChange={(e) => setNewVendor({ ...newVendor, username: e.target.value })}
                    required
                    className="w-full bg-black border border-gray-600 text-green-400 pl-10 pr-4 py-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="vendor_username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-green-400 text-sm mb-2">Password *</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={newVendor.password}
                    onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full bg-black border border-gray-600 text-green-400 pl-10 pr-4 py-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-green-400 text-sm mb-2">Vendor Type</label>
                <select
                  value={newVendor.vendor_type}
                  onChange={(e) => setNewVendor({ ...newVendor, vendor_type: e.target.value })}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                >
                  <option value="escrow">Escrow</option>
                  <option value="finalize_early">Finalize Early</option>
                  <option value="direct_pay">Direct Pay</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  checked={newVendor.is_verified}
                  onChange={(e) => setNewVendor({ ...newVendor, is_verified: e.target.checked })}
                  className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                />
                <label htmlFor="is_verified" className="text-green-400 text-sm">
                  Mark as Verified
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-6 py-3 rounded font-bold transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Vendor'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewVendor({ email: '', password: '', username: '', vendor_type: 'escrow', is_verified: false });
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Create Vendors Modal */}
{/* Batch Create Vendors Modal */}
{showBatchCreateModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold text-white mb-4">Batch Create Vendors</h3>

      {/* Instructions */}
      <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500 rounded">
        <h4 className="font-bold text-blue-400 mb-2">Format Instructions</h4>
        <p className="text-gray-300 text-sm mb-2">
          Enter one vendor per line in CSV format:
        </p>
        <code className="text-green-400 text-sm block bg-black p-2 rounded">
          email,username,password,vendor_type,is_verified
        </code>
        <p className="text-gray-400 text-xs mt-2">
          • vendor_type: escrow, finalize_early, or direct_pay (default: escrow)<br/>
          • is_verified: true or false (default: false)
        </p>
        <div className="mt-2">
          <p className="text-gray-400 text-xs font-semibold">Example:</p>
          <code className="text-green-400 text-xs block bg-black p-2 rounded mt-1">
            vendor1@example.com,CryptoVendor1,SecurePass123,escrow,true<br/>
            vendor2@example.com,DigitalSeller,MyPassword456,finalize_early,false
          </code>
        </div>
      </div>

      {/* Form starts here */}
      <form onSubmit={handleBatchCreateVendors} className="space-y-4">
        <div>
          <label className="block text-green-400 text-sm mb-2">
            Vendor Data (CSV Format) *
          </label>
          <textarea
            value={batchVendors}
            onChange={(e) => setBatchVendors(e.target.value)}
            required
            rows={10}
            className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none font-mono text-sm"
            placeholder="vendor1@example.com,CryptoVendor1,SecurePass123,escrow,true&#10;vendor2@example.com,DigitalSeller,MyPassword456,finalize_early,false"
          />
        </div>

        {batchResults.length > 0 && (
          <div className="max-h-40 overflow-y-auto">
            <h4 className="font-bold text-white mb-2">Results:</h4>
            <div className="space-y-1">
              {batchResults.map((result, index) => (
                <div
                  key={index}
                  className={`text-xs p-2 rounded ${
                    result.status === 'success'
                      ? 'bg-green-900/20 text-green-400'
                      : 'bg-red-900/20 text-red-400'
                  }`}
                >
                  <strong>{result.email}:</strong> {result.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={batchCreating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-3 rounded font-bold transition-colors"
          >
            {batchCreating ? 'Creating Vendors...' : 'Create Vendors'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowBatchCreateModal(false);
              setBatchVendors('');
              setBatchResults([]);
            }}
            className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold transition-colors"
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