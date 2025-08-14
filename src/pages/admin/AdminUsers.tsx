import React, { useState, useEffect } from 'react';
import { Users, Shield, UserX, Search, Edit, Trash2, Crown } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { showGlobalError } from '../../components/CustomAlert';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

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
      fetchUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
      showGlobalError('Error updating admin status');
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
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showGlobalError('Error deleting user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'admins') matchesFilter = user.is_admin;
    else if (filter === 'vendors') matchesFilter = user.is_vendor;
    else if (filter === 'customers') matchesFilter = !user.is_vendor && !user.is_admin;
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
          <div className="flex gap-2">
            {['all', 'admins', 'vendors', 'customers', 'inactive'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-2 rounded font-bold text-xs transition-colors ${
                  filter === filterType
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-green-400'
                }`}
              >
                {filterType.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{users.length}</div>
          <div className="text-gray-400 text-sm">Total Users</div>
        </div>
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {users.filter(u => u.is_admin).length}
          </div>
          <div className="text-gray-400 text-sm">Admins</div>
        </div>
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {users.filter(u => u.is_vendor).length}
          </div>
          <div className="text-gray-400 text-sm">Vendors</div>
        </div>
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {users.filter(u => !u.is_vendor && !u.is_admin).length}
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
                <th className="text-left p-4 text-green-400 font-bold">Email</th>
                <th className="text-left p-4 text-green-400 font-bold">Role</th>
                <th className="text-left p-4 text-green-400 font-bold">Reputation</th>
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
                        {user.is_admin ? (
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
                  <td className="p-4 text-green-400">{user.email}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
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
                      {!user.is_admin && !user.is_vendor && (
                        <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold">
                          CUSTOMER
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-yellow-400 font-bold">
                    {user.reputation_score?.toFixed(1) || '0.0'}
                  </td>
                  <td className="p-4 text-white">
                    {new Date(user.created_at).toLocaleDateString()}
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
                        onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                          user.is_admin
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {user.is_admin ? 'REMOVE ADMIN' : 'MAKE ADMIN'}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No users found</p>
          <p className="text-gray-500">
            {filter === 'all' ? 'No users registered yet' : `No ${filter} found`}
          </p>
        </div>
      )}
    </div>
  );
}