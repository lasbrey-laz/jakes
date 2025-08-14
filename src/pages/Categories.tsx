import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Star, ChevronRight, ChevronDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Categories() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  useEffect(() => {
    fetchData();

    // Check if there's a category parameter in the URL
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    if (subcategoryParam) {
      setSelectedSubcategory(subcategoryParam);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      // Fetch categories - no auth required
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('name');

      // Fetch subcategories - no auth required
      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select('*, categories(name)')
        .order('name');

      // Fetch products - no auth required
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_vendor_id_fkey (username, reputation_score),
          subcategories(name, category_id)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setSubcategories(subcategoriesData || []);
      setCategories([
        { id: 'all', name: 'All Categories', count: productsData?.length || 0 },
        ...(categoriesData || []).map(cat => ({
          ...cat,
          count: productsData?.filter(p => p.category === cat.name).length || 0
        }))
      ]);

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error
      setCategories([{ id: 'all', name: 'All Categories', count: 0 }]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || product.subcategory_id === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price_btc - b.price_btc;
      case 'price-high':
        return b.price_btc - a.price_btc;
      case 'rating':
        return (b.profiles?.reputation_score || 0) - (a.profiles?.reputation_score || 0);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-400 mb-4">CATEGORIES</h1>
          <p className="text-gray-400">Browse our secure marketplace categories</p>
          <p className="text-gray-500 text-sm mt-2">
            <span className="text-yellow-400">Note:</span> Login is optional for browsing. Create an account to make purchases.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
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

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black border border-gray-600 text-green-400 px-4 py-2 rounded focus:border-green-500 focus:outline-none"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Category and Subcategory Dropdowns */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-green-400 text-sm mb-2">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('all');
                }}
                className="w-full bg-black border border-gray-600 text-green-400 px-4 py-2 rounded focus:border-green-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat.id !== 'all').map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-green-400 text-sm mb-2">Subcategory:</label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full bg-black border border-gray-600 text-green-400 px-4 py-2 rounded focus:border-green-500 focus:outline-none"
                disabled={selectedCategory === 'all'}
              >
                <option value="all">All Subcategories</option>
                {subcategories
                  .filter(sub => selectedCategory === 'all' || sub.categories?.name === selectedCategory)
                  .map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            {/* View Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-green-400'
                  }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-green-400'
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Results Count */}
            <div>
              <p className="text-gray-400">
                Showing {sortedProducts.length} results
                {selectedCategory !== 'all' && (
                  selectedSubcategory !== 'all'
                    ? ` in ${subcategories.find(s => s.id === selectedSubcategory)?.name}`
                    : ` in ${selectedCategory}`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-4'}>
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className={`bg-gray-900 border border-gray-700 hover:border-green-500 rounded-lg overflow-hidden cursor-pointer transition-all hover:bg-gray-800 ${viewMode === 'list' ? 'flex items-center p-4' : ''
                }`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="p-6">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-32 object-cover rounded mb-4"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-800 rounded mb-4 flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                    <h3 className="font-bold text-green-400 mb-2">{product.title}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className="text-yellow-400 font-bold">{product.price_btc} BTC</span>
                        {product.price_usd && (
                          <span className="text-green-400 text-sm">${product.price_usd} USD</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-400">{product.profiles?.reputation_score?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Vendor: <span className="text-green-400">{product.profiles?.username}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Stock: {product.stock_quantity}
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 text-center">
                    <button className="text-red-400 hover:text-red-300 font-bold text-sm">
                      VIEW DETAILS
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mr-4 flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-400 mb-1">{product.title}</h3>
                    <div className="text-xs text-gray-500 mb-2">
                      Vendor: <span className="text-green-400">{product.profiles?.username}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-yellow-400 font-bold">{product.price_btc} BTC</span>
                        {product.price_usd && (
                          <span className="text-green-400 text-sm">${product.price_usd}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-400">{product.profiles?.reputation_score?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span className="text-xs text-gray-500">Stock: {product.stock_quantity}</span>
                      {/* Shipping indicators */}
                      <div className="flex gap-1">
                        {product.shipping_worldwide && (
                          <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">🌍</span>
                        )}
                        {product.shipping_eu && (
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">EU</span>
                        )}
                        {product.shipping_us && (
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">US</span>
                        )}
                        {product.shipping_uk && (
                          <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">UK</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="text-red-400 hover:text-red-300 font-bold text-sm px-4">
                    VIEW DETAILS
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {sortedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No products found matching your criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-red-400 hover:text-red-300 font-bold"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}