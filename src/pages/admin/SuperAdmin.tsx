import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Eye, Package, Users, BarChart3, Settings, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../../components/CustomAlert';
import Breadcrumbs, { BreadcrumbItem } from '../../components/Breadcrumbs';

interface DeletedProduct {
  id: string;
  original_product_id: string;
  product_data: any;
  deleted_by: string;
  deleted_at: string;
  deletion_reason: string;
  can_be_restored: boolean;
}

interface SystemStats {
  totalProducts: number;
  totalUsers: number;
  totalVendors: number;
  totalOrders: number;
  deletedProducts: number;
  activeReferralCodes: number;
}

interface AdminProductStats {
  admin_id: string;
  username: string;
  total_products: number;
  products: Array<{
    id: string;
    title: string;
    category: string;
    created_at: string;
    is_active: boolean;
    vendor_username: string;
  }>;
}

export default function SuperAdmin() {
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>([]);
  const [adminProductStats, setAdminProductStats] = useState<AdminProductStats[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [permanentlyDeleting, setPermanentlyDeleting] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DeletedProduct | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showVendorProducts, setShowVendorProducts] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch deleted products
      const { data: deletedData, error: deletedError } = await supabase
        .from('deleted_products')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (deletedError) throw deletedError;

      // Fetch system statistics
      const [
        { count: productsCount },
        { count: usersCount },
        { count: vendorsCount },
        { count: ordersCount },
        { count: referralCodesCount }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_vendor', true),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('referral_codes').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      // Fetch admin product statistics
      // Since products don't track who created them, we'll show all products with vendor info
      // In a real implementation, you'd add a created_by field to track admin creation
      const { data: adminProductsData, error: adminProductsError } = await supabase
        .from('products')
        .select(`
          id,
          title,
          category,
          created_at,
          is_active,
          vendor_id,
          profiles!products_vendor_id_fkey (username)
        `)
        .order('created_at', { ascending: false });

      if (adminProductsError) throw adminProductsError;

      // For now, we'll show products grouped by creation date (admin creation tracking would be better)
      // This is a placeholder - ideally you'd add a created_by field to the products table
      const adminStatsMap = new Map<string, AdminProductStats>();
      
      // Group by creation date (month/year) as a proxy for admin activity
      adminProductsData?.forEach(product => {
        const createdDate = new Date(product.created_at);
        const monthYear = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
        const adminId = monthYear; // Using date as proxy for admin ID
        const adminUsername = `Admin (${monthYear})`; // Placeholder admin name
        
        if (!adminStatsMap.has(adminId)) {
          adminStatsMap.set(adminId, {
            admin_id: adminId,
            username: adminUsername,
            total_products: 0,
            products: []
          });
        }
        
        const adminStats = adminStatsMap.get(adminId)!;
        adminStats.total_products += 1;
        adminStats.products.push({
          id: product.id,
          title: product.title,
          category: product.category,
          created_at: product.created_at,
          is_active: product.is_active,
          vendor_username: (product.profiles as any)?.username || 'Unknown Vendor'
        });
      });

      const adminStatsArray = Array.from(adminStatsMap.values())
        .sort((a, b) => b.total_products - a.total_products);

      setDeletedProducts(deletedData || []);
      setAdminProductStats(adminStatsArray);
      setSystemStats({
        totalProducts: productsCount || 0,
        totalUsers: usersCount || 0,
        totalVendors: vendorsCount || 0,
        totalOrders: ordersCount || 0,
        deletedProducts: deletedData?.length || 0,
        activeReferralCodes: referralCodesCount || 0
      });
    } catch (error) {
      console.error('Error fetching super admin data:', error);
      showGlobalError('Error fetching super admin data');
    } finally {
      setLoading(false);
    }
  };

  const restoreProduct = async (deletedProductId: string) => {
    setRestoring(deletedProductId);
    try {
      const { data, error } = await supabase
        .rpc('restore_deleted_product', {
          p_deleted_product_id: deletedProductId
        });

      if (error) throw error;

      // Remove from deleted products list
      setDeletedProducts(prev => prev.filter(p => p.id !== deletedProductId));
      
      // Update system stats
      if (systemStats) {
        setSystemStats(prev => prev ? {
          ...prev,
          totalProducts: prev.totalProducts + 1,
          deletedProducts: prev.deletedProducts - 1
        } : null);
      }

      showGlobalSuccess('Product restored successfully!');
    } catch (error) {
      console.error('Error restoring product:', error);
      showGlobalError('Error restoring product');
    } finally {
      setRestoring(null);
    }
  };

  const permanentlyDeleteProduct = async (deletedProductId: string) => {
    if (!confirm('Are you sure you want to permanently delete this product? This action cannot be undone.')) {
      return;
    }

    setPermanentlyDeleting(deletedProductId);
    try {
      const { data, error } = await supabase
        .rpc('permanently_delete_product', {
          p_deleted_product_id: deletedProductId
        });

      if (error) throw error;

      // Remove from deleted products list
      setDeletedProducts(prev => prev.filter(p => p.id !== deletedProductId));
      
      // Update system stats
      if (systemStats) {
        setSystemStats(prev => prev ? {
          ...prev,
          deletedProducts: prev.deletedProducts - 1
        } : null);
      }

      showGlobalSuccess('Product permanently deleted');
    } catch (error) {
      console.error('Error permanently deleting product:', error);
      showGlobalError('Error permanently deleting product');
    } finally {
      setPermanentlyDeleting(null);
    }
  };

  const viewProductDetails = (product: DeletedProduct) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading super admin data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-400">System overview and deleted products management</p>
        </div>
        
        {/* Breadcrumbs */}
        <div className="flex-shrink-0">
          <Breadcrumbs
            items={[
              { label: 'Admin', path: '/admin', icon: Settings },
              { label: 'Super Admin', icon: Crown }
            ]}
            className="text-xs"
          />
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-3 rounded-full">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Products</p>
              <p className="text-2xl font-bold text-white">{systemStats?.totalProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-blue-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-full">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Users</p>
              <p className="text-2xl font-bold text-white">{systemStats?.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-purple-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-3 rounded-full">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Vendors</p>
              <p className="text-2xl font-bold text-white">{systemStats?.totalVendors}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-600 p-3 rounded-full">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Orders</p>
              <p className="text-2xl font-bold text-white">{systemStats?.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-3 rounded-full">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Deleted</p>
              <p className="text-2xl font-bold text-white">{systemStats?.deletedProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-indigo-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-full">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Referrals</p>
              <p className="text-2xl font-bold text-white">{systemStats?.activeReferralCodes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Products Overview */}
      <div className="bg-gray-900 border border-blue-500 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Admin Products Overview
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            View products created by admin activity (grouped by creation period)
          </p>
          <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-500 rounded">
            <p className="text-yellow-400 text-xs">
              <strong>Note:</strong> Currently showing products grouped by creation month as a proxy for admin activity. 
              To track which specific admin created each product, add a <code>created_by</code> field to the products table.
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-blue-400 font-bold">Admin Period</th>
                <th className="text-left p-4 text-blue-400 font-bold">Total Products</th>
                <th className="text-left p-4 text-blue-400 font-bold">Active Products</th>
                <th className="text-left p-4 text-blue-400 font-bold">Latest Product</th>
                <th className="text-left p-4 text-blue-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminProductStats.map((adminStats) => (
                <tr key={adminStats.admin_id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="p-4">
                    <div className="text-white font-semibold">{adminStats.username}</div>
                    <div className="text-gray-400 text-sm">Period: {adminStats.admin_id}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-blue-400 font-bold text-lg">{adminStats.total_products}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-green-400 font-bold">
                      {adminStats.products.filter(p => p.is_active).length}
                    </span>
                    <span className="text-gray-400 text-sm"> / {adminStats.total_products}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-300 text-sm">
                      {adminStats.products.length > 0 ? (
                        <>
                          <div>{adminStats.products[0].title}</div>
                          <div className="text-gray-500 text-xs">
                            {new Date(adminStats.products[0].created_at).toLocaleDateString()}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500">No products</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setShowVendorProducts(adminStats.admin_id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold transition-colors"
                    >
                      View Products
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deleted Products Management */}
      <div className="bg-gray-900 border border-red-500 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            Deleted Products Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Restore accidentally deleted products or permanently remove them
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-red-400 font-bold">Product</th>
                <th className="text-left p-4 text-red-400 font-bold">Deleted By</th>
                <th className="text-left p-4 text-red-400 font-bold">Deleted At</th>
                <th className="text-left p-4 text-red-400 font-bold">Reason</th>
                <th className="text-left p-4 text-red-400 font-bold">Status</th>
                <th className="text-left p-4 text-red-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deletedProducts.map((deletedProduct) => (
                <tr key={deletedProduct.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                        {deletedProduct.product_data.image_urls && deletedProduct.product_data.image_urls.length > 0 ? (
                          <img 
                            src={deletedProduct.product_data.image_urls[0]} 
                            alt={deletedProduct.product_data.title} 
                            className="w-full h-full object-cover rounded" 
                          />
                        ) : deletedProduct.product_data.image_url ? (
                          <img 
                            src={deletedProduct.product_data.image_url} 
                            alt={deletedProduct.product_data.title} 
                            className="w-full h-full object-cover rounded" 
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{deletedProduct.product_data.title}</div>
                        <div className="text-gray-400 text-sm">{deletedProduct.product_data.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300 text-sm">{deletedProduct.deleted_by}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-400 text-sm">
                      {new Date(deletedProduct.deleted_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300 text-sm">
                      {deletedProduct.deletion_reason || 'No reason provided'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      deletedProduct.can_be_restored 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {deletedProduct.can_be_restored ? 'RESTORABLE' : 'PERMANENT'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewProductDetails(deletedProduct)}
                        className="text-blue-400 hover:text-blue-300"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {deletedProduct.can_be_restored && (
                        <button
                          onClick={() => restoreProduct(deletedProduct.id)}
                          disabled={restoring === deletedProduct.id}
                          className="text-green-400 hover:text-green-300 disabled:text-gray-500"
                          title="Restore product"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => permanentlyDeleteProduct(deletedProduct.id)}
                        disabled={permanentlyDeleting === deletedProduct.id}
                        className="text-red-400 hover:text-red-300 disabled:text-gray-500"
                        title="Permanently delete"
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

      {deletedProducts.length === 0 && (
        <div className="text-center py-12">
          <Trash2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No deleted products</p>
          <p className="text-gray-500">All products are currently active</p>
        </div>
      )}

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-red-500 rounded-lg p-6 w-full max-w-4xl mx-4 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Deleted Product Details</h3>
              <button
                onClick={() => setShowProductDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Product Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400 text-sm">Title:</span>
                      <p className="text-white">{selectedProduct.product_data.title}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Description:</span>
                      <p className="text-white">{selectedProduct.product_data.description}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Category:</span>
                      <p className="text-white">{selectedProduct.product_data.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Price BTC:</span>
                      <p className="text-white">{selectedProduct.product_data.price_btc}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-3">Deletion Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400 text-sm">Deleted By:</span>
                      <p className="text-white">{selectedProduct.deleted_by}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Deleted At:</span>
                      <p className="text-white">
                        {new Date(selectedProduct.deleted_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Reason:</span>
                      <p className="text-white">
                        {selectedProduct.deletion_reason || 'No reason provided'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedProduct.can_be_restored 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {selectedProduct.can_be_restored ? 'RESTORABLE' : 'PERMANENTLY DELETED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex gap-3">
                  {selectedProduct.can_be_restored && (
                    <button
                      onClick={() => {
                        restoreProduct(selectedProduct.id);
                        setShowProductDetails(false);
                      }}
                      disabled={restoring === selectedProduct.id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-6 py-2 rounded font-bold transition-colors"
                    >
                      {restoring === selectedProduct.id ? 'Restoring...' : 'Restore Product'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      permanentlyDeleteProduct(selectedProduct.id);
                      setShowProductDetails(false);
                    }}
                    disabled={permanentlyDeleting === selectedProduct.id}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-6 py-2 rounded font-bold transition-colors"
                  >
                    {permanentlyDeleting === selectedProduct.id ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                  
                  <button
                    onClick={() => setShowProductDetails(false)}
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

      {/* Vendor Products Detail Modal */}
      {showVendorProducts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                Products by {adminProductStats.find(v => v.admin_id === showVendorProducts)?.username}
              </h2>
              <button
                onClick={() => setShowVendorProducts(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="text-left p-3 text-blue-400 font-bold">Product</th>
                    <th className="text-left p-3 text-blue-400 font-bold">Category</th>
                    <th className="text-left p-3 text-blue-400 font-bold">Status</th>
                    <th className="text-left p-3 text-blue-400 font-bold">Created At</th>
                    <th className="text-left p-3 text-blue-400 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminProductStats
                    .find(v => v.admin_id === showVendorProducts)
                    ?.products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="p-3">
                        <div className="text-white font-semibold">{product.title}</div>
                        <div className="text-gray-400 text-xs">ID: {product.id}</div>
                        <div className="text-gray-500 text-xs">Vendor: {product.vendor_username}</div>
                      </td>
                      <td className="p-3">
                        <span className="text-blue-400">{product.category}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          product.is_active 
                            ? 'bg-green-600 text-white' 
                            : 'bg-red-600 text-white'
                        }`}>
                          {product.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-300 text-sm">
                          {new Date(product.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => window.open(`/product/${product.id}`, '_blank')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowVendorProducts(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
