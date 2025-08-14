import React, { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, AlertTriangle, Eye, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalVendors: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    activeUsers: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [productsRes, vendorsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' }).eq('is_vendor', true),
        supabase.from('orders').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' })
      ]);

      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          products (title),
          profiles!orders_buyer_id_fkey (username)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch top products (mock data for now)
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(5);

      setStats({
        totalProducts: productsRes.count || 0,
        totalVendors: vendorsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue: 12.45678, // Mock BTC value
        pendingOrders: 23, // Mock value
        activeUsers: usersRes.count || 0
      });

      setRecentOrders(orders || []);
      setTopProducts(products || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-green-400">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-900 border border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Vendors</p>
              <p className="text-2xl font-bold text-blue-400">{stats.totalVendors}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-900 border border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-900 border border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Revenue (BTC)</p>
              <p className="text-2xl font-bold text-orange-400">{stats.totalRevenue}</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <button className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg font-bold transition-colors">
            Add Product
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-bold transition-colors">
            Approve Vendor
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg font-bold transition-colors">
            Process Orders
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg font-bold transition-colors">
            View Reports
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-gray-400">No recent orders</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="bg-gray-800 border border-gray-700 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-semibold">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {order.total_btc} BTC
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <p>{order.products?.title}</p>
                    <p>Customer: {order.profiles?.username}</p>
                    <p>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Products
          </h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-gray-400">No products available</p>
            ) : (
              topProducts.map((product) => (
                <div key={product.id} className="bg-gray-800 border border-gray-700 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-semibold">
                      {product.title}
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {product.price_btc} BTC
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <p>Category: {product.category}</p>
                    <p>Stock: {product.stock_quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          System Alerts
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{stats.pendingOrders} orders pending approval</span>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Eye className="w-4 h-4" />
            <span className="text-sm">System security: All green</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <Star className="w-4 h-4" />
            <span className="text-sm">Platform uptime: 99.9%</span>
          </div>
        </div>
      </div>
    </div>
  );
}