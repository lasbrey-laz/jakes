import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Shield, Package, MessageSquare, ArrowLeft, Plus, Minus, LogIn, Eye, Info, Truck, User, FileText } from 'lucide-react';
import { Country } from 'country-state-city';
import { supabase } from '../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../components/CustomAlert';
import ChatModal from '../components/ChatModal';

// Function to generate random view count above 500
const generateRandomViews = () => {
  return Math.floor(Math.random() * (10000 - 500) + 500);
};

interface Product {
  id: string;
  title: string;
  description: string;
  price_usd: number;
  price_btc: number;
  price_xmr: number;
  category: string;
  listing_type: string;
  is_available: boolean;
  unit_type: string;
  stock_quantity: number;
  view_count: number;
  image_urls: string[];
  image_url: string;
  vendor_id: string;
  shipping_from_country: string;
  shipping_to_countries: string[];
  shipping_worldwide: boolean;
  shipping_eu: boolean;
  shipping_us: boolean;
  shipping_uk: boolean;
  shipping_methods: string[];
  shipping_method_costs: {
    [key: string]: {
      usd: number;
      btc: number;
      xmr: number;
    };
  };
  refund_policy: string;
  package_lost_policy: string;
  accepts_monero: boolean;
}

interface Vendor {
  id: string;
  username: string;
  reputation_score: number;
  is_verified: boolean;
  vendor_type: string;
  total_sales: number;
  disputes_won: number;
  disputes_lost: number;
  open_orders: number;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [ordering, setOrdering] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);

  useEffect(() => {
    fetchProduct();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProduct = async () => {
    try {
      // Increment view count
      if (id) {
        await supabase.rpc('increment_view_count', { product_id: id });
      }

      // No auth required for viewing products
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_vendor_id_fkey (username, reputation_score, is_verified, vendor_type, total_sales, disputes_won, disputes_lost, open_orders)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (productError) throw productError;

      setProduct(productData);
      setVendor(productData.profiles);
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  const calculateShippingCost = (method: string, currency: 'usd' | 'btc' | 'xmr') => {
    if (!product?.shipping_method_costs || !product.shipping_method_costs[method]) {
      return 0;
    }
    return product.shipping_method_costs[method][currency] || 0;
  };

  const getTotalCost = (currency: 'usd' | 'btc' | 'xmr') => {
    let productCost = 0;
    let shippingCost = 0;

    switch (currency) {
      case 'usd':
        productCost = (product?.price_usd || 0) * quantity;
        shippingCost = selectedShippingMethod ? calculateShippingCost(selectedShippingMethod, 'usd') : 0;
        break;
      case 'btc':
        productCost = (product?.price_btc || 0) * quantity;
        shippingCost = selectedShippingMethod ? calculateShippingCost(selectedShippingMethod, 'btc') : 0;
        break;
      case 'xmr':
        productCost = (product?.price_xmr || 0) * quantity;
        shippingCost = selectedShippingMethod ? calculateShippingCost(selectedShippingMethod, 'xmr') : 0;
        break;
    }

    return productCost + shippingCost;
  };

  const handleOrder = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      showGlobalError('You must create an account to place orders. Redirecting to login...');
      navigate('/login');
      return;
    }

    if (!selectedShippingMethod) {
      showGlobalError('Please select a shipping method before placing your order.');
      return;
    }

    setOrdering(true);
    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          buyer_id: user.id,
          vendor_id: product?.vendor_id,
          product_id: product?.id,
          quantity,
          total_btc: getTotalCost('btc'),
          status: 'pending',
          shipping_method: selectedShippingMethod,
          shipping_cost_btc: calculateShippingCost(selectedShippingMethod, 'btc')
        }]);

      if (error) throw error;

      showGlobalSuccess('Order placed successfully! Check your orders page for updates.');
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      showGlobalError('You must create an account to place orders. Please login or create an account first.');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Product not found</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'vendor', label: 'Vendor', icon: User },
    { id: 'policies', label: 'Policies', icon: FileText },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header with Breadcrumbs */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>

                              {/* Breadcrumbs */}
                <div className="text-orange-400 text-sm">
                  {product?.category}
                </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Single Column Layout */}
          <div className="space-y-6">
            {/* 1. Product Name */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h1 className="text-3xl font-bold text-white mb-2">{product.title}</h1>
                              <div className="text-orange-400 text-sm">
                  {product?.category}
                </div>
            </div>

            {/* 2. Product Image */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Pictures</h2>
              {product.image_urls && product.image_urls.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="flex justify-center">
                    <img
                      src={product.image_urls[0]}
                      alt={product.title}
                      className="w-60 h-60 object-cover rounded-lg"
                    />
                  </div>

                  {/* Thumbnail Gallery */}
                  {product.image_urls.length > 1 && (
                    <div className="grid grid-cols-3 gap-3">
                      {product.image_urls.map((imageUrl: string, index: number) => (
                        <div key={index} className="relative group cursor-pointer">
                          <img
                            src={imageUrl}
                            alt={`${product.title} - Image ${index + 1}`}
                            className="w-full h-24 object-cover rounded border-2 border-gray-600 hover:border-green-400 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-center">
                  <img
                    src={product.image_url || 'https://via.placeholder.com/600x400?text=No+Image'}
                    alt={product.title}
                    className="w-60 h-60 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* 3. Listing */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Listing</h2>
              <textarea
                value={product.description}
                readOnly
                rows={7}
                className="w-full bg-gray-700 border border-gray-600 text-gray-300 p-4 rounded resize-none overflow-y-auto leading-relaxed"
                style={{ minHeight: 'auto' }}
              />
            </div>

            {/* 4. Listing Details */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold text-white mb-4">Listing Details</h3>
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Product Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Listing type:</span>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${
                      product.listing_type === 'escrow' ? 'bg-green-600 text-white' : 
                      product.listing_type === 'finalize_early' ? 'bg-orange-600 text-white' : 
                      'bg-blue-600 text-white'
                    }`}>
                      {product.listing_type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Viewed:</span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">
                      {product.view_count || generateRandomViews()} times
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stock:</span>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${
                      product.is_available ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping:</span>
                    <span className="text-white">
                      from {product.shipping_from_country ? Country.getCountryByCode(product.shipping_from_country)?.name : 'Unknown'} to Worldwide
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unit:</span>
                    <span className="text-white">{product.unit_type || 'Piece'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min Order:</span>
                    <span className="text-white">
                      {product.price_xmr && `XMR ${product.price_xmr}`}
                      {product.price_xmr && product.price_usd && ' | '}
                      {product.price_usd && `USD ${product.price_usd}`}
                    </span>
                  </div>
                </div>

                {/* Right Column - Vendor Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vendor:</span>
                    <button 
                      onClick={() => setShowVendorModal(true)}
                      className="text-orange-400 font-bold hover:text-orange-300 cursor-pointer transition-colors"
                    >
                      {vendor?.username}
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating:</span>
                    <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">
                      {vendor?.reputation_score || 98} %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vendor type:</span>
                    <span className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-bold">
                      {product.listing_type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sales:</span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">
                      {vendor?.total_sales || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Open Orders:</span>
                    <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">
                      {vendor?.open_orders || 0} open
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Disputes:</span>
                    <div className="flex gap-2">
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                        {vendor?.disputes_won || 0} won
                      </span>
                      <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs">
                        {vendor?.disputes_lost || 0} lost
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Ordering Options */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold text-white mb-4">Ordering Options</h3>
              <div className="grid grid-cols-3 gap-4">

                {/* Shipping Options */}
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Shipping Options</label>
                  <select
                    value={selectedShippingMethod}
                    onChange={(e) => setSelectedShippingMethod(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Please select</option>
                    {product.shipping_methods?.map((method: string) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                {/* Order Quantity */}
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Order Quantity ({product.unit_type || 'Piece'})</label>
                  <div className="flex items-center border border-gray-600 rounded">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center p-2 bg-gray-700 border-none text-white focus:outline-none"
                      min="1"
                    />
                  </div>
                </div>

                {/* Bulk Quantities */}
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Bulk Quantities</label>
                  <select className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded focus:border-green-500 focus:outline-none">
                    <option value="">Please select</option>
                    <option value="10">10+ pieces</option>
                    <option value="50">50+ pieces</option>
                    <option value="100">100+ pieces</option>
                    <option value="500">500+ pieces</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 8. Policies */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold text-white mb-4">Policies</h3>

              {/* Refund Policy */}
              {product.refund_policy && (
                <div className="mb-4">
                  <h4 className="text-green-400 font-semibold mb-2">Refund Policy</h4>
                  <p className="text-gray-300 text-sm">{product.refund_policy}</p>
                </div>
              )}

              {/* Package Lost Policy */}
              {product.package_lost_policy && (
                <div className="mb-4">
                  <h4 className="text-blue-400 font-semibold mb-2">Package Lost Policy</h4>
                  <p className="text-gray-300 text-sm">{product.package_lost_policy}</p>
                </div>
              )}

              {/* Platform Policies */}
              <div className="space-y-3">
                <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                  <h4 className="text-green-400 font-semibold mb-2">Platform Protection Policy</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Full refund if product not received within 30 days</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Refund if product significantly differs from description</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Dispute resolution within 48 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                &lt;&lt; Back
              </button>
              <button
                onClick={handleOrder}
                disabled={!product.is_available || ordering}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        vendorId={product?.vendor_id || ''}
        vendorName={vendor?.username || 'Vendor'}
        productId={product?.id}
        productTitle={product?.title}
      />

      {/* Vendor Profile Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Vendor Profile</h2>
              <button
                onClick={() => setShowVendorModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-white">{vendor?.username}</h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-yellow-400">{vendor?.reputation_score || 98}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border border-gray-600 rounded">
                  <div className="text-green-400 font-bold text-xl">{vendor?.total_sales || 0}</div>
                  <div className="text-gray-400 text-xs">Total Sales</div>
                </div>
                <div className="text-center p-3 border border-gray-600 rounded">
                  <div className="text-blue-400 font-bold text-xl">{vendor?.open_orders || 0}</div>
                  <div className="text-gray-400 text-xs">Open Orders</div>
                </div>
                <div className="text-center p-3 border border-gray-600 rounded">
                  <div className="text-green-400 font-bold text-xl">{vendor?.disputes_won || 0}</div>
                  <div className="text-gray-400 text-xs">Disputes Won</div>
                </div>
                <div className="text-center p-3 border border-gray-600 rounded">
                  <div className="text-red-400 font-bold text-xl">{vendor?.disputes_lost || 0}</div>
                  <div className="text-gray-400 text-xs">Disputes Lost</div>
                </div>
              </div>

              <div className="text-center p-3 border border-gray-600 rounded">
                <div className="text-orange-400 font-bold text-lg">
                  {product.listing_type?.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-gray-400 text-xs">Vendor Type</div>
              </div>

              <button
                onClick={() => {
                  setShowVendorModal(false);
                  setShowChatModal(true);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Contact Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}