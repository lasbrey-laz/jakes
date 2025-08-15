import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Eye, Package, Users, BarChart3, Settings, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../../components/CustomAlert';

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

export default function SuperAdmin() {
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [permanentlyDeleting, setPermanentlyDeleting] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DeletedProduct | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

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

      setDeletedProducts(deletedData || []);
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
    </div>
  );
}
