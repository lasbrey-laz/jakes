import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { showGlobalError } from '../components/CustomAlert';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchOrders();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showGlobalError('You must be logged in to view orders. Redirecting to login...');
      navigate('/login');
      return;
    }
    setUser(user);
  };
  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (title, price_btc),
          profiles!orders_vendor_id_fkey (username)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading orders...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-400 mb-4">MY ORDERS</h1>
        <p className="text-gray-400">Track your purchases and order history</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-4 mb-8">
        <div className="flex gap-4">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
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
                  {orders.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No orders found</p>
          <p className="text-gray-500">
            {filter === 'all' ? 'You haven\'t made any purchases yet' : `No ${filter} orders`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-900 border border-gray-700 hover:border-green-500 rounded-lg p-6 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-green-400 mb-1">
                    Order #{order.id.slice(0, 8)}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(order.created_at).toLocaleDateString()} at{' '}
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className={`flex items-center gap-2 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="font-bold text-sm">{order.status.toUpperCase()}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-2">Product Details</h4>
                  <div className="space-y-2">
                    <p className="text-green-400">{order.products?.title}</p>
                    <p className="text-gray-400 text-sm">
                      Vendor: <span className="text-green-400">{order.profiles?.username}</span>
                    </p>
                    <p className="text-gray-400 text-sm">
                      Quantity: <span className="text-white">{order.quantity}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Payment Details</h4>
                  <div className="space-y-2">
                    <p className="text-yellow-400 font-bold">
                      Total: {order.total_btc} BTC
                    </p>
                    <p className="text-gray-400 text-sm">
                      Unit Price: {order.products?.price_btc} BTC
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  VIEW DETAILS
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 text-green-400 px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  CONTACT VENDOR
                </button>
                {order.status === 'delivered' && (
                  <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-bold text-sm transition-colors">
                    LEAVE REVIEW
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}