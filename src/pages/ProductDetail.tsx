import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Shield, Package, MessageSquare, ArrowLeft, Plus, Minus, LogIn, Eye, Info, Truck, User, FileText } from 'lucide-react';
import { Country } from 'country-state-city';
import { supabase } from '../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../components/CustomAlert';

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
                      total_btc: (product?.price_btc || 0) * quantity,
          status: 'pending',
          shipping_method: selectedShippingMethod,
          shipping_cost_btc: calculateShippingCost(selectedShippingMethod, 'btc')
        }]);

      if (error) throw error;

      showGlobalSuccess('Order placed successfully! Check your orders page for updates.');
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      showGlobalError('Error placing order. Please try again.');
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
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Product Image and Basic Info */}
            <div className="lg:col-span-2">
              {/* Product Images */}
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative">
                      <img
                        src={product.image_urls[0]}
                        alt={product.title}
                        className="w-full h-96 object-cover rounded-lg"
                      />
                    </div>
                    
                    {/* Thumbnail Gallery */}
                    {product.image_urls.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {product.image_urls.map((imageUrl: string, index: number) => (
                          <div key={index} className="relative group cursor-pointer">
                            <img
                              src={imageUrl}
                              alt={`${product.title} - Image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border-2 border-gray-600 hover:border-green-400 transition-colors"
                            />
                            {index === 0 && (
                              <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                Main
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={product.image_url || 'https://via.placeholder.com/600x400?text=No+Image'}
                    alt={product.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Product Title and Basic Info */}
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h1 className="text-3xl font-bold text-white mb-4">{product.title}</h1>
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-green-400 bg-gray-700 px-3 py-1 rounded text-sm">
                    {product.category}
                  </span>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${
                    product.listing_type === 'escrow' ? 'bg-green-600 text-white' : 
                    product.listing_type === 'finalize_early' ? 'bg-yellow-600 text-white' : 
                    'bg-blue-600 text-white'
                  }`}>
                    {product.listing_type?.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{product.view_count || generateRandomViews()} views</span>
                  </div>
                </div>

                {/* Multi-Currency Pricing */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-white mb-3">Pricing</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.price_usd && (
                      <div className="text-center">
                        <div className="text-green-400 font-bold text-xl">${product.price_usd}</div>
                        <div className="text-gray-400 text-sm">USD</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold text-xl">{product.price_btc} BTC</div>
                      <div className="text-gray-400 text-sm">Bitcoin</div>
                    </div>
                    {product.price_xmr && (
                      <div className="text-center">
                        <div className="text-red-400 font-bold text-xl">{product.price_xmr} XMR</div>
                        <div className="text-gray-400 text-sm">Monero</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-gray-800 rounded-lg">
                {/* Tab Navigation */}
                <div className="border-b border-gray-700">
                  <nav className="flex space-x-8 px-6">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                              ? 'border-green-400 text-green-400'
                              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {tab.label}
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div>
                      <h3 className="font-bold text-white mb-4">Description</h3>
                      <p className="text-gray-300 leading-relaxed mb-6">{product.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400">Availability:</span>
                            <span className={`font-bold px-3 py-1 rounded text-sm ${
                              product.is_available ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {product.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Unit:</span>
                            <span className="text-white font-bold">{product.unit_type || 'Piece'}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400">Stock:</span>
                            <span className="text-white font-bold">{product.stock_quantity}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Views:</span>
                            <span className="text-white font-bold">{product.view_count || generateRandomViews()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping Tab */}
                  {activeTab === 'shipping' && (
                    <div>
                      <h3 className="font-bold text-white mb-4">Shipping Information</h3>
                      
                      {product.shipping_from_country && (
                        <div className="bg-gray-700 rounded-lg p-4 mb-4">
                          <p className="text-gray-400">
                            Ships from: <span className="text-blue-400">{Country.getCountryByCode(product.shipping_from_country)?.name}</span>
                          </p>
                        </div>
                      )}
                      
                      {/* Shipping Regions */}
                      <div className="bg-gray-700 rounded-lg p-4 mb-4">
                        <p className="text-gray-400 mb-2">Ships to:</p>
                        
                        {/* Specific Countries */}
                        {Array.isArray(product.shipping_to_countries) && product.shipping_to_countries.length > 0 && (
                          <div className="mb-3">
                            <p className="text-gray-400 text-sm mb-2">Specific Countries:</p>
                            <div className="flex flex-wrap gap-2">
                              {product.shipping_to_countries.map((countryCode: string) => (
                                <span key={countryCode} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold">
                                  {Country.getCountryByCode(countryCode)?.name || countryCode}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Regional Shipping */}
                        <div className="flex flex-wrap gap-2">
                          {product.shipping_worldwide && (
                            <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold">🌍 Worldwide</span>
                          )}
                          {product.shipping_eu && (
                            <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold">🇪🇺 European Union</span>
                          )}
                          {product.shipping_us && (
                            <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold">🇺🇸 United States</span>
                          )}
                          {product.shipping_uk && (
                            <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-semibold">🇬🇧 United Kingdom</span>
                          )}
                        </div>
                        
                        {/* No shipping info message */}
                        {(!Array.isArray(product.shipping_to_countries) || product.shipping_to_countries.length === 0) && 
                         !product.shipping_worldwide && !product.shipping_eu && !product.shipping_us && !product.shipping_uk && (
                          <div className="mt-3 p-3 bg-gray-600 rounded">
                            <span className="text-gray-300 text-sm">Shipping information not available</span>
                          </div>
                        )}
                      </div>

                      {/* Shipping Methods */}
                      {product.shipping_methods && product.shipping_methods.length > 0 && (
                        <div>
                          <h4 className="font-bold text-white mb-3">Select Shipping Method:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {product.shipping_methods.map((method: string) => {
                              const methodCosts = product.shipping_method_costs?.[method];
                              const isSelected = selectedShippingMethod === method;
                              return (
                                <div 
                                  key={method} 
                                  className={`bg-gray-700 border rounded p-3 cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'border-green-500 bg-green-900/20' 
                                      : 'border-gray-600 hover:border-gray-500'
                                  }`}
                                  onClick={() => setSelectedShippingMethod(method)}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      type="radio"
                                      name="shippingMethod"
                                      checked={isSelected}
                                      onChange={() => setSelectedShippingMethod(method)}
                                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                                    />
                                    <div className="font-semibold text-white">{method}</div>
                                  </div>
                                  {methodCosts && (
                                    <div className="text-xs space-y-1 ml-6">
                                      {methodCosts.usd && (
                                        <div className="text-green-400">${methodCosts.usd} USD</div>
                                      )}
                                      {methodCosts.btc && (
                                        <div className="text-yellow-400">{methodCosts.btc} BTC</div>
                                      )}
                                      {methodCosts.xmr && (
                                        <div className="text-purple-400">{methodCosts.xmr} XMR</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {selectedShippingMethod && (
                            <div className="mt-4 p-3 bg-green-900/20 border border-green-500 rounded">
                              <p className="text-green-400 text-sm font-semibold">
                                Selected: {selectedShippingMethod}
                              </p>
                              <p className="text-gray-300 text-xs mt-1">
                                Shipping cost will be added to your total
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vendor Tab */}
                  {activeTab === 'vendor' && (
                    <div>
                      <h3 className="font-bold text-white mb-4">Vendor Information</h3>
                      
                      <div className="bg-gray-700 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                            <Shield className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-semibold text-lg">{vendor?.username}</span>
                              {vendor?.is_verified && (
                                <Shield className="w-4 h-4 text-blue-400" />
                              )}
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                vendor?.vendor_type === 'escrow' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                              }`}>
                                {vendor?.vendor_type?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-yellow-400 text-sm">{vendor?.reputation_score?.toFixed(1) || '0.0'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-600">
                          <div className="text-center">
                            <div className="text-green-400 font-bold text-xl">{vendor?.total_sales || 0}</div>
                            <div className="text-gray-400 text-xs">Total Sales</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-400 font-bold text-xl">{vendor?.open_orders || 0}</div>
                            <div className="text-gray-400 text-xs">Open Orders</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-400 font-bold text-xl">{vendor?.disputes_won || 0}</div>
                            <div className="text-gray-400 text-xs">Disputes Won</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 font-bold text-xl">{vendor?.disputes_lost || 0}</div>
                            <div className="text-gray-400 text-xs">Disputes Lost</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Policies Tab */}
                  {activeTab === 'policies' && (
                    <div>
                      <h3 className="font-bold text-white mb-4">Policies & Information</h3>
                      
                      {(product.refund_policy || product.package_lost_policy) && (
                        <div className="space-y-4 mb-6">
                          {product.refund_policy && (
                            <div className="bg-gray-700 rounded-lg p-4">
                              <h4 className="font-semibold text-green-400 mb-2">Refund Policy:</h4>
                              <p className="text-gray-300 text-sm">{product.refund_policy}</p>
                            </div>
                          )}
                          {product.package_lost_policy && (
                            <div className="bg-gray-700 rounded-lg p-4">
                              <h4 className="font-semibold text-green-400 mb-2">Package Lost Policy:</h4>
                              <p className="text-gray-300 text-sm">{product.package_lost_policy}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Methods */}
                      <div className="bg-gray-700 rounded-lg p-4 mb-4">
                        <h4 className="font-bold text-white mb-3">Accepted Payment Methods</h4>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-500 rounded px-3 py-2">
                            <span className="text-yellow-400 font-bold">₿</span>
                            <span className="text-yellow-400 text-sm">Bitcoin</span>
                          </div>
                          {product.accepts_monero && (
                            <div className="flex items-center gap-2 bg-purple-900/20 border border-purple-500 rounded px-3 py-2">
                              <span className="text-purple-400 font-bold">ɱ</span>
                              <span className="text-purple-400 text-sm">Monero</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Security Notice */}
                      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-red-400 mt-1" />
                          <div>
                            <h4 className="font-bold text-red-400 mb-2">Security Notice</h4>
                            <p className="text-gray-300 text-sm">
                              This platform uses an escrow system to protect buyers. Once you make a payment, the funds are securely held and will only be released to the vendor after you confirm that the order has been received. Always verify vendor reputation before purchasing.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Purchase Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Quantity Selector */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-white mb-4">Quantity</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="bg-gray-700 hover:bg-gray-600 text-green-400 w-10 h-10 rounded flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-bold text-xl w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="bg-gray-700 hover:bg-gray-600 text-green-400 w-10 h-10 rounded flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-400" />
                    Shipping Details
                  </h3>
                  
                  {/* Ships From */}
                  {product.shipping_from_country && (
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Ships from:</p>
                      <div className="bg-gray-700 rounded p-3">
                        <span className="text-blue-400 font-medium">
                          {Country.getCountryByCode(product.shipping_from_country)?.name || product.shipping_from_country}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Ships To */}
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">Ships to:</p>
                    <div className="space-y-2">
                      {/* Specific Countries */}
                      {Array.isArray(product.shipping_to_countries) && product.shipping_to_countries.length > 0 && (
                        <div className="bg-gray-700 rounded p-3">
                          <div className="flex flex-wrap gap-2">
                            {product.shipping_to_countries.map((countryCode: string) => (
                              <span key={countryCode} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                {Country.getCountryByCode(countryCode)?.name || countryCode}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Regional Shipping */}
                      <div className="flex flex-wrap gap-2">
                        {product.shipping_worldwide && (
                          <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">🌍 Worldwide</span>
                        )}
                        {product.shipping_eu && (
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">🇪🇺 EU</span>
                        )}
                        {product.shipping_us && (
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">🇺🇸 US</span>
                        )}
                        {product.shipping_uk && (
                          <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">🇬🇧 UK</span>
                        )}
                      </div>
                      
                      {/* No shipping info message */}
                      {(!Array.isArray(product.shipping_to_countries) || product.shipping_to_countries.length === 0) && 
                       !product.shipping_worldwide && !product.shipping_eu && !product.shipping_us && !product.shipping_uk && (
                        <div className="bg-gray-700 rounded p-3">
                          <span className="text-gray-400 text-sm">Shipping information not available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Method Selection */}
                {product.shipping_methods && product.shipping_methods.length > 0 && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                    <h3 className="font-bold text-white mb-4">Shipping Method</h3>
                    <div className="space-y-3">
                      {product.shipping_methods.map((method: string) => {
                        const methodCosts = product.shipping_method_costs?.[method];
                        const isSelected = selectedShippingMethod === method;
                        return (
                          <div 
                            key={method} 
                            className={`bg-gray-700 border rounded p-3 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-green-500 bg-green-900/20' 
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                            onClick={() => setSelectedShippingMethod(method)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="radio"
                                name="shippingMethod"
                                checked={isSelected}
                                onChange={() => setSelectedShippingMethod(method)}
                                className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                              />
                              <div className="font-semibold text-white text-sm">{method}</div>
                            </div>
                            {methodCosts && (
                              <div className="text-xs space-y-1 ml-6">
                                {methodCosts.usd && (
                                  <div className="text-green-400">${methodCosts.usd} USD</div>
                                )}
                                {methodCosts.btc && (
                                  <div className="text-yellow-400">{methodCosts.btc} BTC</div>
                                )}
                                {methodCosts.xmr && (
                                  <div className="text-purple-400">{methodCosts.xmr} XMR</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {selectedShippingMethod && (
                      <div className="mt-4 p-3 bg-green-900/20 border border-green-500 rounded">
                        <p className="text-green-400 text-sm font-semibold">
                          Selected: {selectedShippingMethod}
                        </p>
                        <p className="text-gray-300 text-xs mt-1">
                          Shipping cost added to total below
                        </p>
                      </div>
                    )}
                    
                    {/* Cost Breakdown */}
                    {selectedShippingMethod && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <h4 className="font-bold text-white mb-3">Cost Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Product Total:</span>
                            <span className="text-yellow-400 font-bold">
                              {(product.price_btc * quantity).toFixed(8)} BTC
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-400">Shipping:</span>
                            <span className="text-blue-400 font-bold">
                              {calculateShippingCost(selectedShippingMethod, 'btc').toFixed(8)} BTC
                            </span>
                          </div>
                          
                          <div className="border-t border-gray-600 pt-3">
                            <div className="flex justify-between">
                              <span className="text-white font-bold text-lg">Final Total:</span>
                              <span className="text-yellow-400 font-bold text-lg">
                                {getTotalCost('btc').toFixed(8)} BTC
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Shipping Method Required Notice */}
                {user && product.shipping_methods && product.shipping_methods.length > 0 && !selectedShippingMethod && (
                  <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-yellow-400 mt-1" />
                      <div>
                        <h4 className="font-bold text-yellow-400 mb-2">Shipping Method Required</h4>
                        <p className="text-gray-300 text-sm">
                          Please select a shipping method above before placing your order.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {user ? (
                    <button
                      onClick={handleOrder}
                      disabled={ordering || !product.is_available || (product.shipping_methods && product.shipping_methods.length > 0 && !selectedShippingMethod)}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {ordering ? 'PLACING ORDER...' : !product.is_available ? 'UNAVAILABLE' : (product.shipping_methods && product.shipping_methods.length > 0 && !selectedShippingMethod) ? 'SELECT SHIPPING METHOD' : 'PLACE ORDER'}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      LOGIN TO PURCHASE
                    </button>
                  )}

                  <button
                    onClick={() => user ? null : navigate('/login')}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-green-400 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {user ? 'CONTACT VENDOR' : 'LOGIN TO CONTACT VENDOR'}
                  </button>
                </div>

                {/* Login Notice for Non-Authenticated Users */}
                {!user && (
                  <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <LogIn className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                        <h4 className="font-bold text-blue-400 mb-2">Account Required</h4>
                        <p className="text-gray-300 text-sm">
                          Create a free account to purchase products and contact vendors.
                          Registration is quick and secure.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}