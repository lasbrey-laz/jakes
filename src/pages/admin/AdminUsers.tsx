import React, { useState, useEffect } from 'react';
import { Users, Shield, UserX, Search, Edit, Trash2, Crown, Star, Mail, Calendar, Activity, Eye, Key, UserCheck, UserX as UserXIcon } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../../components/CustomAlert';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
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
      setCurrentUser(profile);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      showGlobalSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      showGlobalError('Error updating user status');
    }
  };

  const toggleAdminStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges?`)) return;

    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      showGlobalSuccess(`Admin privileges ${!currentStatus ? 'granted' : 'removed'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
      showGlobalError('Error updating admin status');
    }
  };

  const toggleSuperAdminStatus = async (id: string, currentStatus: boolean) => {
    if (!currentUser?.is_super_admin) {
      showGlobalError('Only super admins can manage super admin privileges');
      return;
    }

    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} SUPER ADMIN privileges? This is a powerful role.`)) return;

    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_super_admin: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      showGlobalSuccess(`Super admin privileges ${!currentStatus ? 'granted' : 'removed'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating super admin status:', error);
      showGlobalError('Error updating super admin status');
    }
  };

  const toggleVendorStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_vendor: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      showGlobalSuccess(`Vendor status ${!currentStatus ? 'granted' : 'removed'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      showGlobalError('Error updating vendor status');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      showGlobalSuccess('User deactivated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showGlobalError('Error deleting user');
    }
  };

  const viewUserDetails = (user: any) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const editUser = (user: any) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          username: editingUser.username,
          email: editingUser.email,
          reputation_score: editingUser.reputation_score
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      showGlobalSuccess('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showGlobalError('Error updating user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'super_admins') matchesFilter = user.is_super_admin;
    else if (filter === 'admins') matchesFilter = user.is_admin;
    else if (filter === 'vendors') matchesFilter = user.is_vendor;
    else if (filter === 'customers') matchesFilter = !user.is_vendor && !user.is_admin && !user.is_super_admin;
    else if (filter === 'inactive') matchesFilter = !user.is_active;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Users Management
          </h1>
          <p className="text-gray-400">Manage all platform users and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-gray-600 text-green-400 pl-10 pr-4 py-2 rounded focus:border-green-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'super_admins', 'admins', 'vendors', 'customers', 'inactive'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-2 rounded font-bold text-xs transition-colors ${
                  filter === filterType
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-green-400'
                }`}
              >
                {filterType.toUpperCase().replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{users.length}</div>
          <div className="text-gray-400 text-sm">Total Users</div>
        </div>
        <div className="bg-gray-900 border border-yellow-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {users.filter(u => u.is_super_admin).length}
          </div>
          <div className="text-gray-400 text-sm">Super Admins</div>
        </div>
        <div className="bg-gray-900 border border-purple-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {users.filter(u => u.is_admin && !u.is_super_admin).length}
          </div>
          <div className="text-gray-400 text-sm">Admins</div>
        </div>
        <div className="bg-gray-900 border border-blue-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {users.filter(u => u.is_vendor).length}
          </div>
          <div className="text-gray-400 text-sm">Vendors</div>
        </div>
        <div className="bg-gray-900 border border-indigo-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-indigo-400">
            {users.filter(u => !u.is_vendor && !u.is_admin && !u.is_super_admin).length}
          </div>
          <div className="text-gray-400 text-sm">Customers</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 border border-green-500 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-green-400 font-bold">User</th>
                <th className="text-left p-4 text-green-400 font-bold">Contact</th>
                <th className="text-left p-4 text-green-400 font-bold">Roles</th>
                <th className="text-left p-4 text-green-400 font-bold">Stats</th>
                <th className="text-left p-4 text-green-400 font-bold">Join Date</th>
                <th className="text-left p-4 text-green-400 font-bold">Status</th>
                <th className="text-left p-4 text-green-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        {user.is_super_admin ? (
                          <Crown className="w-5 h-5 text-yellow-500" />
                        ) : user.is_admin ? (
                          <Crown className="w-5 h-5 text-purple-400" />
                        ) : user.is_vendor ? (
                          <Shield className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Users className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{user.username}</div>
                        <div className="text-gray-400 text-sm">ID: {user.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-green-400">
                        <Mail className="w-3 h-3" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {user.is_super_admin && (
                        <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">
                          SUPER ADMIN
                        </span>
                      )}
                      {user.is_admin && (
                        <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                          ADMIN
                        </span>
                      )}
                      {user.is_vendor && (
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                          VENDOR
                        </span>
                      )}
                      {!user.is_admin && !user.is_vendor && !user.is_super_admin && (
                        <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold">
                          CUSTOMER
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-yellow-400 text-sm font-bold">
                          {user.reputation_score?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        user.is_active
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewUserDetails(user)}
                        className="text-blue-400 hover:text-blue-300"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => editUser(user)}
                        className="text-green-400 hover:text-green-300"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Super Admin Controls */}
                      {currentUser?.is_super_admin && (
                        <button
                          onClick={() => toggleSuperAdminStatus(user.id, user.is_super_admin)}
                          className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                            user.is_super_admin
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          }`}
                          title={user.is_super_admin ? 'Remove super admin' : 'Make super admin'}
                        >
                          {user.is_super_admin ? 'REMOVE SUPER' : 'MAKE SUPER'}
                        </button>
                      )}
                      
                      {/* Admin Controls */}
                      {(currentUser?.is_super_admin || currentUser?.is_admin) && (
                        <button
                          onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                          className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                            user.is_admin
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                          title={user.is_admin ? 'Remove admin' : 'Make admin'}
                        >
                          {user.is_admin ? 'REMOVE ADMIN' : 'MAKE ADMIN'}
                        </button>
                      )}
                      
                      {/* Vendor Controls */}
                      {(currentUser?.is_super_admin || currentUser?.is_admin) && (
                        <button
                          onClick={() => toggleVendorStatus(user.id, user.is_vendor)}
                          className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                            user.is_vendor
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          title={user.is_vendor ? 'Remove vendor' : 'Make vendor'}
                        >
                          {user.is_vendor ? 'REMOVE VENDOR' : 'MAKE VENDOR'}
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete user"
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No users found</p>
          <p className="text-gray-500">
            {filter === 'all' ? 'No users registered yet' : `No ${filter} found`}
          </p>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400 text-sm">Username:</span>
                      <p className="text-white">{selectedUser.username}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Email:</span>
                      <p className="text-white">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">User ID:</span>
                      <p className="text-white font-mono text-sm">{selectedUser.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Join Date:</span>
                      <p className="text-white">{new Date(selectedUser.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-3">Roles & Permissions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Super Admin:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedUser.is_super_admin ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {selectedUser.is_super_admin ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Admin:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedUser.is_admin ? 'bg-purple-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {selectedUser.is_admin ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Vendor:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedUser.is_vendor ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {selectedUser.is_vendor ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedUser.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {selectedUser.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      editUser(selectedUser);
                      setShowUserDetails(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition-colors"
                  >
                    Edit User
                  </button>
                  
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-md mx-4 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Username</label>
                <input
                  type="text"
                  value={editingUser.username || ''}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  className="w-full bg-black border border-gray-600 text-white px-3 py-2 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full bg-black border border-gray-600 text-white px-3 py-2 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Reputation Score</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={editingUser.reputation_score || 0}
                  onChange={(e) => setEditingUser({...editingUser, reputation_score: parseFloat(e.target.value)})}
                  className="w-full bg-black border border-gray-600 text-white px-3 py-2 rounded focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex gap-3">
                  <button
                    onClick={saveUserEdit}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition-colors"
                  >
                    Save Changes
                  </button>
                  
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}