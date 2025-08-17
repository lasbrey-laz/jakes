import { useState, useEffect } from 'react';
import { Ghost, Shield, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  console.log(categories);
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [vendorsCount, setVendorsCount] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: vendorData, count: vendorsCount, error: vendorError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('is_vendor', true)
        .eq('is_active', true)
        .eq('vendor_status', 'approved');

      if (vendorError) throw vendorError;

      setVendors(vendorData || []);
      setVendorsCount(vendorsCount || 0);
      // Fetch categories from backend
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch products count and featured products separately
      const [productsCountRes, productsDataRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact' }).eq('is_active', true),
        supabase.from('products').select(`
          *,
          profiles!products_vendor_id_fkey (username, reputation_score)
        `).eq('is_active', true).order('created_at', { ascending: false }).limit(8)
      ]);

      const { data: productsData, error: productsError } = productsDataRes;
      const { count: productsCount, error: countError } = productsCountRes;

      if (productsError || countError) throw productsError || countError;

      // Add product counts to categories
      const categoriesWithCounts = categoriesData?.map(category => ({
        ...category,
        count: productsData?.filter(product => product.category === category.name).length || 0
      })) || [];

      setCategories(categoriesWithCounts);
      setProducts(productsData || []);
      setProductsCount(productsCount || 0);
      
      // Debug logging
      console.log('Products fetched:', productsData?.length || 0);
      console.log('Products count:', productsCount || 0);
      console.log('Categories fetched:', categoriesData?.length || 0);
      console.log('Vendors fetched:', vendorData?.length || 0);
      console.log('Vendors count:', vendorsCount || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error fetching vendors:', error);
      setVendors([]);
      setCategories([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get featured products (top 4 by reputation or recent)
  const featuredProducts = products
    .sort((a, b) => (b.profiles?.reputation_score || 0) - (a.profiles?.reputation_score || 0))
    .slice(0, 4);

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/categories?category=${encodeURIComponent(categoryName)}`);
  };

  // Calculate stats
  const totalVendors = vendorsCount || 0;
  // const totalVendors = new Set(products.map(p => p.vendor_id)).size;
  const totalListings = productsCount || 0;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <>
      {/* Stats Bar */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-4 mb-8">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-red-400 font-bold text-lg">{totalVendors}</div>
            <div className="text-gray-500 text-xs">ACTIVE VENDORS</div>
          </div>
          <div>
            <div className="text-green-400 font-bold text-lg">{totalListings}</div>
            <div className="text-gray-500 text-xs">Products</div>
          </div>
          <div>
            <div className="text-yellow-400 font-bold text-lg">99.7%</div>
            <div className="text-gray-500 text-xs">UPTIME</div>
          </div>
          <div>
            <div className="text-blue-400 font-bold text-lg">24/7</div>
            <div className="text-gray-500 text-xs">SUPPORT</div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-2">
          <Ghost className="w-6 h-6" />
          CATEGORIES
        </h2>
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No categories available</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.name)}
                className="bg-gray-900 border border-gray-700 hover:border-red-500 p-6 rounded-lg cursor-pointer transition-all hover:bg-gray-800 group"
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">{category.icon || '📦'}</div>
                  <h3 className="font-bold text-green-400 group-hover:text-red-400 mb-2">{category.name}</h3>
                  {/* <div className="text-yellow-400 font-bold text-lg">{category.count}</div>
                  <p className="text-gray-500 text-xs mt-2">{category.description}</p> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Products */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-red-400 mb-6">FEATURED LISTINGS</h2>
        {featuredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No featured products available</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="bg-gray-900 border border-gray-700 hover:border-green-500 rounded-lg overflow-hidden cursor-pointer transition-all hover:bg-gray-800"
              >
                <div className="p-6">
                  {product.image_urls && product.image_urls.length > 0 ? (
                    <img
                      src={product.image_urls[0]}
                      alt={product.title}
                      className="w-full h-32 object-cover rounded mb-4"
                    />
                  ) : product.image_url ? (
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
                    <span className="text-yellow-400 font-bold">{product.price_btc} BTC</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-400">
                        {product.profiles?.reputation_score?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Vendor: <span className="text-green-400">{product.profiles?.username}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Stock: {product.is_available ? 'Available' : 'Not in Stock'}</span>
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
                <div className="bg-gray-800 p-3 text-center">
                  <button className="text-red-400 hover:text-red-300 font-bold text-sm">
                    VIEW DETAILS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-red-400 mt-1" />
          <div>
            <h3 className="font-bold text-red-400 mb-2">SECURITY NOTICE</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              All transactions are encrypted and routed through secure channels.
              Never share your private keys or personal information.
              Always verify vendor reputation before making purchases.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}