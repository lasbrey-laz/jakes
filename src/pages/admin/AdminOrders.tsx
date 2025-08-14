import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Clock, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { showGlobalError } from '../../components/CustomAlert';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (title, price_btc),
          profiles!orders_buyer_id_fkey (username, email),
          vendor:profiles!orders_vendor_id_fkey (username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      showGlobalError('Error updating order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'confirmed': return 'text-blue-400';
      case 'shipped': return 'text-purple-400';
      case 'delivered': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Package className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.products?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || order.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Orders Management
          </h1>
          <p className="text-gray-400">Monitor and manage all marketplace orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-gray-600 text-green-400 pl-10 pr-4 py-2 rounded focus:border-green-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded font-bold text-xs transition-colors ${
                  filter === status
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-green-400'
                }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-900 border border-green-500 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-green-400 font-bold">Order ID</th>
                <th className="text-left p-4 text-green-400 font-bold">Product</th>
                <th className="text-left p-4 text-green-400 font-bold">Customer</th>
                <th className="text-left p-4 text-green-400 font-bold">Vendor</th>
                <th className="text-left p-4 text-green-400 font-bold">Amount</th>
                <th className="text-left p-4 text-green-400 font-bold">Status</th>
                <th className="text-left p-4 text-green-400 font-bold">Date</th>
                <th className="text-left p-4 text-green-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="p-4">
                    <span className="text-green-400 font-mono text-sm">
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="text-white font-semibold">{order.products?.title}</div>
                      <div className="text-gray-400 text-sm">Qty: {order.quantity}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="text-green-400">{order.profiles?.username}</div>
                      <div className="text-gray-400 text-sm">{order.profiles?.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="text-blue-400">{order.vendor?.username}</div>
                      <div className="text-gray-400 text-sm">{order.vendor?.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-yellow-400 font-bold">{order.total_btc} BTC</span>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-2 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="font-bold text-sm">{order.status.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="bg-black border border-gray-600 text-green-400 px-2 py-1 rounded text-xs focus:border-green-500 focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button className="text-blue-400 hover:text-blue-300">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No orders found</p>
          <p className="text-gray-500">
            {filter === 'all' ? 'No orders have been placed yet' : `No ${filter} orders`}
          </p>
        </div>
      )}
    </div>
  );
}