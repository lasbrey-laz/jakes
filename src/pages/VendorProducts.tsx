import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Shield, MapPin, Package, ArrowLeft, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function VendorProducts() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (id) {
      fetchVendorAndProducts();
    }
  }, [id]);

  const fetchVendorAndProducts = async () => {
    setLoading(true);
    try {
      // Fetch vendor information
      const { data: vendorData, error: vendorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('is_vendor', true)
        .single();

      if (vendorError) throw vendorError;

      // Fetch vendor's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      setVendor(vendorData);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      setVendor(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'price_low':
        return (a.price_usd || 0) - (b.price_usd || 0);
      case 'price_high':
        return (b.price_usd || 0) - (a.price_usd || 0);
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getUniqueCategories = () => {
    const categories = products.map(product => product.category);
    return ['all', ...Array.from(new Set(categories))];
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading vendor store...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg">Vendor not found</div>
        <button
          onClick={() => navigate('/vendors')}
          className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
        >
          Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/vendors')}
          className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-red-400">{vendor.username}'s Store</h1>
          <p className="text-gray-400">Browse products from this verified vendor</p>
        </div>
      </div>

      {/* Vendor Info Card */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">🛡️</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-green-400">{vendor.username}</h2>
              {vendor.is_verified && (
                <div title="Verified Vendor">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-yellow-400 font-bold">{vendor.reputation_score ?? 0}</span>
                <span className="text-gray-500">reputation</span>
              </div>
            </div>
          </div>
        </div>
        {vendor.description && (
          <p className="text-gray-300">{vendor.description}</p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-gray-600 text-green-400 pl-10 pr-4 py-2 rounded focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black border border-gray-600 text-green-400 p-2 rounded focus:border-green-500 focus:outline-none"
          >
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black border border-gray-600 text-green-400 p-2 rounded focus:border-green-500 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Products Count */}
      <div className="flex items-center justify-between">
        <div className="text-gray-400">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </div>
        <div className="text-gray-500 text-sm">
          Total: {products.length} products
        </div>
      </div>

      {/* Products Grid */}
      {sortedProducts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className="bg-gray-900 border border-gray-700 hover:border-green-500 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-800"
            >
              {/* Product Image */}
              <div className="w-full h-48 bg-gray-800 rounded mb-4 overflow-hidden">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <img
                    src={product.image_urls[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-white text-lg line-clamp-2">{product.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold text-lg">
                    {product.price_btc} BTC
                  </span>
                  {product.price_usd && (
                    <span className="text-green-400 text-sm">
                      (${product.price_usd})
                    </span>
                  )}
                </div>

                {/* Category */}
                <div className="text-blue-400 text-sm">{product.category}</div>

                {/* Stock Status */}
                <div className={`text-sm ${product.is_available ? 'text-green-400' : 'text-red-400'}`}>
                  {product.is_available ? 'In Stock' : 'Out of Stock'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No products found</p>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'This vendor has not added any products yet'
            }
          </p>
        </div>
      )}
    </div>
  );
}
