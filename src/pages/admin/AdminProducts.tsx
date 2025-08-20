import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, Eye, Star, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Country } from 'country-state-city';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../../components/CustomAlert';



export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingSearchTerm, setShippingSearchTerm] = useState('');
  const [customShippingMethod, setCustomShippingMethod] = useState('');
  const [customShippingCosts, setCustomShippingCosts] = useState({
    usd: '',
    btc: '',
    xmr: ''
  });
  
  // User authentication state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Country selection state
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  
  // Shipping to countries selection state
  const [showShippingToCountriesModal, setShowShippingToCountriesModal] = useState(false);
  const [shippingToCountriesSearchTerm, setShippingToCountriesSearchTerm] = useState('');

  // Country helper functions
  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪',
      'AU': '🇦🇺', 'JP': '🇯🇵', 'BR': '🇧🇷', 'IN': '🇮🇳', 'MX': '🇲🇽'
    };
    return flags[countryCode] || '🌍';
  };

  const getCountryName = (countryCode: string) => {
    const names: { [key: string]: string } = {
      'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
      'AU': 'Australia', 'JP': 'Japan', 'BR': 'Brazil', 'IN': 'India', 'MX': 'Mexico'
    };
    return names[countryCode] || countryCode;
  };
  
  // Predefined shipping methods
  const predefinedShippingMethods = [
    'USPS Priority Mail',
    'USPS First Class',
    'USPS Media Mail',
    'USPS Ground',
    'FedEx Ground',
    'FedEx 2Day',
    'FedEx Standard Overnight',
    'UPS Ground',
    'UPS 2nd Day Air',
    'UPS Next Day Air',
    'DHL Express',
    'DHL Ground',
    'Canada Post Regular',
    'Canada Post Express',
    'Royal Mail 1st Class',
    'Royal Mail 2nd Class',
    'Royal Mail Special Delivery',
    'Australia Post Regular',
    'Australia Post Express',
    'EMS (Express Mail Service)',
    'ePacket',
    'DHL eCommerce',
    'USPS International First Class',
    'USPS International Priority',
    'FedEx International Economy',
    'FedEx International Priority',
    'UPS Worldwide Expedited',
    'UPS Worldwide Express',
    'Local Pickup',
    'Hand Delivery',
    'Digital Delivery',
    'Email Delivery',
    'Download Link',
    'Combined Shipping',
    'Free Shipping',
    'Calculated Shipping'
  ];
  const [newProduct, setNewProduct] = useState({
    vendor_id: '',
    vendor_country_filter: '',
    title: '',
    description: '',
    price_btc: '',
    price_usd: '',
    price_gbp: '',
    price_eur: '',
    price_aud: '',
    price_cad: '',
    price_jpy: '',
    price_cny: '',
    price_inr: '',
    price_brl: '',
    price_mxn: '',
    price_ngn: '',
    price_ghs: '',
    price_kes: '',
    price_zar: '',
    price_rub: '',
    price_try: '',
    price_xmr: '',
    category: '',
    subcategory_id: '',
    image_url: '',
    image_urls: [] as string[],
    is_available: true,
    is_active: true,
    accepts_monero: false,
    shipping_from_country: '',
    shipping_to_countries: [] as string[],
    shipping_worldwide: false,
    shipping_eu: false,
    shipping_us: false,
    shipping_uk: false,
    shipping_cost_usd: '',
    shipping_cost_btc: '',
    shipping_cost_xmr: '',
    shipping_methods: [] as string[],
    minimum_order_amount_usd: '',
    minimum_order_amount_xmr: '',
    listing_type: 'escrow',
    unit_type: 'piece',
    refund_policy: '',
    package_lost_policy: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (vendors.length > 0) {
      checkCurrentUser();
    }
  }, [vendors]);

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // Get user profile to check if they're a vendor and get their country
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && profile) {
          setUserProfile(profile);
          
          // If user is a vendor, auto-select them in the vendor dropdown
          if (profile.is_vendor && profile.country) {
            // Find vendor by user ID and set as selected
            const vendorVendor = vendors.find(v => v.id === user.id);
            if (vendorVendor) {
              setNewProduct(prev => ({ ...prev, vendor_id: user.id }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking current user:', error);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_vendor_id_fkey (username, reputation_score)
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*, categories(name)')
        .order('name');

      if (subcategoriesError) throw subcategoriesError;

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_vendor', true)
        .eq('is_active', true)
        .order('username');

      if (vendorsError) throw vendorsError;

      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
      setVendors(vendorsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.vendor_id || !newProduct.title || !newProduct.description || !newProduct.price_btc || !newProduct.category) {
      showGlobalError('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const { vendor_country_filter, ...productDataWithoutFilter } = newProduct;
      const productData = {
        ...productDataWithoutFilter,
        price_btc: parseFloat(newProduct.price_btc),
        price_usd: newProduct.price_usd ? parseFloat(newProduct.price_usd) : null,
        price_gbp: newProduct.price_gbp ? parseFloat(newProduct.price_gbp) : null,
        price_eur: newProduct.price_eur ? parseFloat(newProduct.price_eur) : null,
        price_aud: newProduct.price_aud ? parseFloat(newProduct.price_aud) : null,
        price_cad: newProduct.price_cad ? parseFloat(newProduct.price_cad) : null,
        price_jpy: newProduct.price_jpy ? parseFloat(newProduct.price_jpy) : null,
        price_cny: newProduct.price_cny ? parseFloat(newProduct.price_cny) : null,
        price_inr: newProduct.price_inr ? parseFloat(newProduct.price_inr) : null,
        price_brl: newProduct.price_brl ? parseFloat(newProduct.price_brl) : null,
        price_mxn: newProduct.price_mxn ? parseFloat(newProduct.price_mxn) : null,
        price_ngn: newProduct.price_ngn ? parseFloat(newProduct.price_ngn) : null,
        price_ghs: newProduct.price_ghs ? parseFloat(newProduct.price_ghs) : null,
        price_kes: newProduct.price_kes ? parseFloat(newProduct.price_kes) : null,
        price_zar: newProduct.price_zar ? parseFloat(newProduct.price_zar) : null,
        price_rub: newProduct.price_rub ? parseFloat(newProduct.price_rub) : null,
        price_try: newProduct.price_try ? parseFloat(newProduct.price_try) : null,
        price_xmr: newProduct.price_xmr ? parseFloat(newProduct.price_xmr) : null,
        shipping_from_country: newProduct.shipping_from_country || null,
        shipping_to_countries: newProduct.shipping_to_countries && newProduct.shipping_to_countries.length > 0 ? newProduct.shipping_to_countries : [],
        shipping_worldwide: newProduct.shipping_worldwide,
        shipping_eu: newProduct.shipping_eu,
        shipping_us: newProduct.shipping_us,
        shipping_uk: newProduct.shipping_uk,
        shipping_cost_usd: newProduct.shipping_cost_usd ? parseFloat(newProduct.shipping_cost_usd) : null,
        shipping_cost_btc: newProduct.shipping_cost_btc ? parseFloat(newProduct.shipping_cost_btc) : null,
        shipping_cost_xmr: newProduct.shipping_cost_xmr ? parseFloat(newProduct.shipping_cost_xmr) : null,
        shipping_methods: newProduct.shipping_methods && newProduct.shipping_methods.length > 0 ? newProduct.shipping_methods : [],
        minimum_order_amount_usd: newProduct.minimum_order_amount_usd ? parseFloat(newProduct.minimum_order_amount_usd) : null,
        minimum_order_amount_xmr: newProduct.minimum_order_amount_xmr ? parseFloat(newProduct.minimum_order_amount_xmr) : null,
        subcategory_id: newProduct.subcategory_id || null,
        image_urls: newProduct.image_urls.length > 0 ? newProduct.image_urls : null
      };

      console.log('Creating product with data:', productData);

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;
      
            console.log('Product created successfully:', data);
      
      // Test: Try to read the created product to verify data was saved
      if (data && data[0]) {
        const { data: readData, error: readError } = await supabase
          .from('products')
          .select('*')
          .eq('id', data[0].id)
          .single();
        
        if (readError) {
          console.error('Error reading created product:', readError);
        } else {
          console.log('Read back created product:', readData);
        }
      }

      // Reset form
      setNewProduct({
        vendor_id: '',
        vendor_country_filter: '',
        title: '',
        description: '',
            price_btc: '',
    price_usd: '',
    price_gbp: '',
    price_eur: '',
    price_aud: '',
    price_cad: '',
    price_jpy: '',
    price_cny: '',
    price_inr: '',
    price_brl: '',
    price_mxn: '',
    price_ngn: '',
    price_ghs: '',
    price_kes: '',
    price_zar: '',
    price_rub: '',
    price_try: '',
    price_xmr: '',
        category: '',
        subcategory_id: '',
        image_url: '',
        image_urls: [],
        is_available: true,
        is_active: true,
        accepts_monero: false,
        shipping_from_country: '',
        shipping_to_countries: [],
        shipping_worldwide: false,
        shipping_eu: false,
        shipping_us: false,
        shipping_uk: false,
        shipping_cost_usd: '',
        shipping_cost_btc: '',
        shipping_cost_xmr: '',
        shipping_methods: [],
        minimum_order_amount_usd: '',
        minimum_order_amount_xmr: '',
        listing_type: 'escrow',
        unit_type: 'piece',
        refund_policy: '',
        package_lost_policy: ''
      });
      setShowCreateModal(false);
      fetchData();
      showGlobalSuccess('Product created successfully!');
    } catch (error) {
      console.error('Error creating product:', error);
      showGlobalError('Error creating product: ' + (error as any).message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.vendor_id || !editingProduct.title || !editingProduct.description || !editingProduct.price_btc || !editingProduct.category) {
      showGlobalError('Please fill in all required fields');
      return;
    }

    try {
      // Extract only the product fields, excluding joined data like 'profiles'
      const productData = {
        vendor_id: editingProduct.vendor_id,
        title: editingProduct.title,
        description: editingProduct.description,
        price_btc: parseFloat(editingProduct.price_btc),
        price_usd: editingProduct.price_usd ? parseFloat(editingProduct.price_usd) : null,
        price_gbp: editingProduct.price_gbp ? parseFloat(editingProduct.price_gbp) : null,
        price_eur: editingProduct.price_eur ? parseFloat(editingProduct.price_eur) : null,
        price_aud: editingProduct.price_aud ? parseFloat(editingProduct.price_aud) : null,
        price_cad: editingProduct.price_cad ? parseFloat(editingProduct.price_cad) : null,
        price_jpy: editingProduct.price_jpy ? parseFloat(editingProduct.price_jpy) : null,
        price_cny: editingProduct.price_cny ? parseFloat(editingProduct.price_cny) : null,
        price_inr: editingProduct.price_inr ? parseFloat(editingProduct.price_inr) : null,
        price_brl: editingProduct.price_brl ? parseFloat(editingProduct.price_brl) : null,
        price_mxn: editingProduct.price_mxn ? parseFloat(editingProduct.price_mxn) : null,
        price_ngn: editingProduct.price_ngn ? parseFloat(editingProduct.price_ngn) : null,
        price_ghs: editingProduct.price_ghs ? parseFloat(editingProduct.price_ghs) : null,
        price_kes: editingProduct.price_kes ? parseFloat(editingProduct.price_kes) : null,
        price_zar: editingProduct.price_zar ? parseFloat(editingProduct.price_zar) : null,
        price_rub: editingProduct.price_rub ? parseFloat(editingProduct.price_rub) : null,
        price_try: editingProduct.price_try ? parseFloat(editingProduct.price_try) : null,
        price_xmr: editingProduct.price_xmr ? parseFloat(editingProduct.price_xmr) : null,
        category: editingProduct.category,
        subcategory_id: editingProduct.subcategory_id || null,
        image_url: editingProduct.image_url,
        image_urls: editingProduct.image_urls && editingProduct.image_urls.length > 0 ? editingProduct.image_urls : null,
        is_available: editingProduct.is_available,
        is_active: editingProduct.is_active,
        accepts_monero: editingProduct.accepts_monero,
        shipping_from_country: editingProduct.shipping_from_country,
        shipping_to_countries: editingProduct.shipping_to_countries,
        shipping_worldwide: editingProduct.shipping_worldwide,
        shipping_eu: editingProduct.shipping_eu,
        shipping_us: editingProduct.shipping_us,
        shipping_uk: editingProduct.shipping_uk,
        shipping_cost_usd: editingProduct.shipping_cost_usd ? parseFloat(editingProduct.shipping_cost_usd) : null,
        shipping_cost_btc: editingProduct.shipping_cost_btc ? parseFloat(editingProduct.shipping_cost_btc) : null,
        shipping_cost_xmr: editingProduct.shipping_cost_xmr ? parseFloat(editingProduct.shipping_cost_xmr) : null,
        shipping_methods: editingProduct.shipping_methods && editingProduct.shipping_methods.length > 0 ? editingProduct.shipping_methods : [],
        minimum_order_amount_usd: editingProduct.minimum_order_amount_usd ? parseFloat(editingProduct.minimum_order_amount_usd) : null,
        minimum_order_amount_xmr: editingProduct.minimum_order_amount_xmr ? parseFloat(editingProduct.minimum_order_amount_xmr) : null,
        listing_type: editingProduct.listing_type,
        unit_type: editingProduct.unit_type,
        refund_policy: editingProduct.refund_policy,
        package_lost_policy: editingProduct.package_lost_policy
      };

      console.log('Updating product with data:', productData);

      const { data, error } = await supabaseAdmin
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
        .select();

      if (error) throw error;
      
      console.log('Product updated successfully:', data);

      setEditingProduct(null);
      fetchData();
      showGlobalSuccess('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      showGlobalError('Error updating product: ' + (error as any).message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const reason = prompt('Please provide a reason for deletion (optional):');
    
    try {
      // Use the new function to move product to deleted_products table
      const { data, error } = await supabase
        .rpc('move_product_to_deleted', {
          p_product_id: id,
          p_deletion_reason: reason
        });

      if (error) throw error;
      fetchData();
      showGlobalSuccess('Product moved to deleted products. Super admin can review and restore if needed.');
    } catch (error) {
      console.error('Error deleting product:', error);
      showGlobalError('Error deleting product');
    }
  };

  const toggleProductStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabaseAdmin
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating product status:', error);
      showGlobalError('Error updating product status');
    }
  };

  const addImageUrl = (productSetter: any, currentProduct: any) => {
    const newImageUrls = [...(currentProduct.image_urls || []), ''];
    productSetter({ ...currentProduct, image_urls: newImageUrls });
  };

  const updateImageUrl = (index: number, value: string, productSetter: any, currentProduct: any) => {
    const newImageUrls = [...(currentProduct.image_urls || [])];
    newImageUrls[index] = value;
    productSetter({ ...currentProduct, image_urls: newImageUrls });
  };

  const removeImageUrl = (index: number, productSetter: any, currentProduct: any) => {
    const newImageUrls = (currentProduct.image_urls || []).filter((_: any, i: number) => i !== index);
    productSetter({ ...currentProduct, image_urls: newImageUrls });
  };

  // File upload functions for local image uploads
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, productSetter: any, currentProduct: any) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showGlobalError(`File ${file.name} is not an image. Please select only image files.`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showGlobalError(`File ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Error uploading file:', error);
          showGlobalError(`Failed to upload ${file.name}. Please try again.`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        const currentUrls = currentProduct.image_urls || [];
        const newImageUrls = [...currentUrls, ...uploadedUrls];
        productSetter({ ...currentProduct, image_urls: newImageUrls });
        showGlobalSuccess(`Successfully uploaded ${uploadedUrls.length} image(s)`);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      showGlobalError('Error uploading images. Please try again.');
    } finally {
      setUploadingImages(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const removeImage = (index: number, productSetter: any, currentProduct: any) => {
    const newImageUrls = (currentProduct.image_urls || []).filter((_: any, i: number) => i !== index);
    productSetter({ ...currentProduct, image_urls: newImageUrls });
  };

  const clearAllImages = (productSetter: any, currentProduct: any) => {
    productSetter({ ...currentProduct, image_urls: [] });
  };

  // Shipping methods management functions
  const addShippingMethod = (productSetter: any, currentProduct: any, method: string) => {
    const currentMethods = Array.isArray(currentProduct.shipping_methods) ? currentProduct.shipping_methods : [];
    if (!currentMethods.includes(method)) {
      const newMethods = [...currentMethods, method];
      productSetter({ 
        ...currentProduct, 
        shipping_methods: newMethods
      });
    }
  };

  const removeShippingMethod = (productSetter: any, currentProduct: any, method: string) => {
    const currentMethods = Array.isArray(currentProduct.shipping_methods) ? currentProduct.shipping_methods : [];
    const newMethods = currentMethods.filter((m: string) => m !== method);
    productSetter({ 
      ...currentProduct, 
      shipping_methods: newMethods
    });
  };

  const addCustomShippingMethod = (productSetter: any, currentProduct: any) => {
    if (customShippingMethod.trim()) {
      const method = customShippingMethod.trim();
      addShippingMethod(productSetter, currentProduct, method);
      
      // Reset custom form
      setCustomShippingMethod('');
      setCustomShippingCosts({ usd: '', btc: '', xmr: '' });
      setShowShippingModal(false);
    }
  };

  // Shipping to countries management functions
  const addShippingToCountry = (productSetter: any, currentProduct: any, countryCode: string) => {
    const currentCountries = Array.isArray(currentProduct.shipping_to_countries) ? currentProduct.shipping_to_countries : [];
    if (!currentCountries.includes(countryCode)) {
      const newCountries = [...currentCountries, countryCode];
      productSetter({ 
        ...currentProduct, 
        shipping_to_countries: newCountries
      });
    }
  };

  const removeShippingToCountry = (productSetter: any, currentProduct: any, countryCode: string) => {
    const currentCountries = Array.isArray(currentProduct.shipping_to_countries) ? currentProduct.shipping_to_countries : [];
    const newCountries = currentCountries.filter((code: string) => code !== countryCode);
    productSetter({ 
      ...currentProduct, 
      shipping_to_countries: newCountries
    });
  };

  const getFilteredShippingMethods = () => {
    const selectedMethods = Array.isArray(newProduct.shipping_methods) ? newProduct.shipping_methods : [];
    return predefinedShippingMethods.filter(method => 
      !selectedMethods.includes(method) &&
      method.toLowerCase().includes(shippingSearchTerm.toLowerCase())
    );
  };

  // Get filtered countries for search
  const getFilteredCountries = () => {
    return Country.getAllCountries().filter(country => 
      country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
      country.isoCode.toLowerCase().includes(countrySearchTerm.toLowerCase())
    );
  };

  // Get filtered countries for shipping to countries
  const getFilteredShippingToCountries = () => {
    const selectedCountries = editingProduct ? (editingProduct.shipping_to_countries || []) : (newProduct.shipping_to_countries || []);
    return Country.getAllCountries().filter(country => 
      !selectedCountries.includes(country.isoCode) &&
      (country.name.toLowerCase().includes(shippingToCountriesSearchTerm.toLowerCase()) ||
       country.isoCode.toLowerCase().includes(shippingToCountriesSearchTerm.toLowerCase()))
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.profiles?.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'active') matchesFilter = product.is_active;
    else if (filter === 'inactive') matchesFilter = !product.is_active;
    else if (filter === 'available') matchesFilter = product.is_available;
    else if (filter === 'unavailable') matchesFilter = !product.is_available;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6" />
            Products Management
          </h1>
          <p className="text-gray-400">Manage marketplace products and listings</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
        <div className="grid md:grid-cols-2 gap-4">
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
          <div className="flex gap-2">
            {['all', 'active', 'inactive', 'available', 'unavailable'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-2 rounded font-bold text-xs transition-colors ${
                  filter === filterType
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-green-400'
                }`}
              >
                {filterType.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-gray-900 border border-green-500 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-green-400 font-bold">Product</th>
                <th className="text-left p-4 text-green-400 font-bold">Vendor</th>
                <th className="text-left p-4 text-green-400 font-bold">Category</th>
                <th className="text-left p-4 text-green-400 font-bold">Price (BTC)</th>
                <th className="text-left p-4 text-green-400 font-bold">Stock Status</th>
                <th className="text-left p-4 text-green-400 font-bold">Product Status</th>
                <th className="text-left p-4 text-green-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                        {product.image_urls && product.image_urls.length > 0 ? (
                          <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover rounded" />
                        ) : product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover rounded" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{product.title}</div>
                        <div className="text-gray-400 text-sm">Views: {product.view_count || 0}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-green-400">{product.profiles?.username}</div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-gray-400">{product.profiles?.reputation_score?.toFixed(1) || '0.0'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-blue-400">{product.category}</div>
                    {product.subcategory_id && (
                      <div className="text-gray-400 text-sm">
                        {subcategories.find(s => s.id === product.subcategory_id)?.name}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-yellow-400 font-bold">{product.price_btc}</div>
                    {product.price_usd && (
                      <div className="text-green-400 text-sm">${product.price_usd}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-white">{product.is_available ? 'Available' : 'Not in Stock'}</div>
                    <div className={`text-xs ${product.is_available ? 'text-green-400' : 'text-red-400'}`}>
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active)}
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        product.is_active
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {product.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProduct({
                  ...product,
                  shipping_methods: product.shipping_methods || ['USPS Priority', 'Tracking Mail', 'Post Express with Tracking', 'Express Envelope', 'Express Satchel', 'Combined Shipping'],
                  shipping_method_costs: product.shipping_method_costs || {
                    'USPS Priority': { usd: 15.00, btc: 0.0005, xmr: 0.05 },
                    'Tracking Mail': { usd: 8.00, btc: 0.0003, xmr: 0.03 },
                    'Post Express with Tracking': { usd: 25.00, btc: 0.0008, xmr: 0.08 },
                    'Express Envelope': { usd: 12.00, btc: 0.0004, xmr: 0.04 },
                    'Express Satchel': { usd: 18.00, btc: 0.0006, xmr: 0.06 },
                    'Combined Shipping': { usd: 5.00, btc: 0.0002, xmr: 0.02 }
                  }
                })}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-400 hover:text-red-300"
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

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No products found</p>
          <p className="text-gray-500">
            {filter === 'all' ? 'No products have been created yet' : `No ${filter} products`}
          </p>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-4xl mx-4 my-8">
            <h3 className="text-xl font-bold text-white mb-4">Create New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Vendor *</label>
                  
                  {/* Country Filter */}
                  <div className="mb-2">
                    <select
                      value={newProduct.vendor_country_filter || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, vendor_country_filter: e.target.value, vendor_id: '' })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-2 rounded focus:border-green-500 focus:outline-none text-sm"
                    >
                      <option value="">All Countries</option>
                      <option value="US">🇺🇸 United States</option>
                      <option value="CA">🇨🇦 Canada</option>
                      <option value="GB">🇬🇧 United Kingdom</option>
                      <option value="FR">🇫🇷 France</option>
                      <option value="DE">🇩🇪 Germany</option>
                      <option value="AU">🇦🇺 Australia</option>
                      <option value="JP">🇯🇵 Japan</option>
                      <option value="BR">🇧🇷 Brazil</option>
                      <option value="IN">🇮🇳 India</option>
                      <option value="MX">🇲🇽 Mexico</option>
                    </select>
                  </div>
                  
                  <select
                    value={newProduct.vendor_id}
                    onChange={(e) => setNewProduct({ ...newProduct, vendor_id: e.target.value })}
                    required
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select vendor...</option>
                    {vendors
                      .filter(vendor => !newProduct.vendor_country_filter || vendor.country === newProduct.vendor_country_filter)
                      .map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.username}
                          {vendor.country && ` (${getCountryFlag(vendor.country)} ${getCountryName(vendor.country)})`}
                          {vendor.id === currentUser?.id && ' (You)'}
                        </option>
                      ))}
                  </select>
                  {userProfile?.is_vendor && (
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-selected: {userProfile.username} from {getCountryFlag(userProfile.country)} {getCountryName(userProfile.country)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Title *</label>
                  <input
                    type="text"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    required
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Product title..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-green-400 text-sm mb-2">Description *</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  placeholder="Product description..."
                />
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Pricing</h3>
                
                {/* Primary Currencies */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price BTC *</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={newProduct.price_btc}
                      onChange={(e) => setNewProduct({ ...newProduct, price_btc: e.target.value })}
                      required
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00000000"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price USD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_usd}
                      onChange={(e) => setNewProduct({ ...newProduct, price_usd: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price XMR</label>
                    <input
                      type="number"
                      step="0.000000000001"
                      value={newProduct.price_xmr}
                      onChange={(e) => setNewProduct({ ...newProduct, price_xmr: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.000000000000"
                    />
                  </div>
                </div>

                {/* Additional Currencies */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price GBP</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_gbp}
                      onChange={(e) => setNewProduct({ ...newProduct, price_gbp: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price EUR</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_eur}
                      onChange={(e) => setNewProduct({ ...newProduct, price_eur: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price CAD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_cad}
                      onChange={(e) => setNewProduct({ ...newProduct, price_cad: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price AUD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_aud}
                      onChange={(e) => setNewProduct({ ...newProduct, price_aud: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* More Currencies */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price JPY</label>
                    <input
                      type="number"
                      step="1"
                      value={newProduct.price_jpy}
                      onChange={(e) => setNewProduct({ ...newProduct, price_jpy: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price CNY</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_cny}
                      onChange={(e) => setNewProduct({ ...newProduct, price_cny: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price INR</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_inr}
                      onChange={(e) => setNewProduct({ ...newProduct, price_inr: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price BRL</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_brl}
                      onChange={(e) => setNewProduct({ ...newProduct, price_brl: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Regional Currencies */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price MXN</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_mxn}
                      onChange={(e) => setNewProduct({ ...newProduct, price_mxn: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price NGN</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_ngn}
                      onChange={(e) => setNewProduct({ ...newProduct, price_ngn: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price GHS</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_ghs}
                      onChange={(e) => setNewProduct({ ...newProduct, price_ghs: e.target.value })}
                      className="w-full bg-black border border-gray-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price KES</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_kes}
                      onChange={(e) => setNewProduct({ ...newProduct, price_kes: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Additional Regional Currencies */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price ZAR</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_zar}
                      onChange={(e) => setNewProduct({ ...newProduct, price_zar: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price RUB</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_rub}
                      onChange={(e) => setNewProduct({ ...newProduct, price_rub: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price TRY</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price_try}
                      onChange={(e) => setNewProduct({ ...newProduct, price_try: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Category Section */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value, subcategory_id: '' })}
                    required
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Subcategory</label>
                  <select
                    value={newProduct.subcategory_id}
                    onChange={(e) => setNewProduct({ ...newProduct, subcategory_id: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    disabled={!newProduct.category}
                  >
                    <option value="">Select subcategory...</option>
                    {subcategories
                      .filter(sub => sub.categories?.name === newProduct.category)
                      .map(subcategory => (
                        <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-green-400 text-sm mb-2">Product Images</label>
                
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center mb-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    Select images from your device (JPG, PNG, GIF - Max 5MB each)
                  </p>
                      <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setNewProduct, newProduct)}
                    className="hidden"
                    id="file-upload-new"
                    disabled={uploadingImages}
                  />
                  <label
                    htmlFor="file-upload-new"
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded font-bold cursor-pointer transition-colors ${
                      uploadingImages 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        SELECT IMAGES
                      </>
                    )}
                  </label>
                </div>

                {/* Display Uploaded Images */}
                {newProduct.image_urls && newProduct.image_urls.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">Uploaded Images ({newProduct.image_urls.length})</h4>
                      <button
                        type="button"
                        onClick={() => clearAllImages(setNewProduct, newProduct)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {newProduct.image_urls.map((url: string, index: number) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-gray-600"
                          />
                  <button
                    type="button"
                            onClick={() => removeImage(index, setNewProduct, newProduct)}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                            <X className="w-3 h-3" />
                  </button>
                </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-white">Shipping Options</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Ships From</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProduct.shipping_from_country ? Country.getCountryByCode(newProduct.shipping_from_country)?.name || newProduct.shipping_from_country : ''}
                        placeholder="Select country..."
                        readOnly
                        className="flex-1 bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none cursor-pointer"
                        onClick={() => setShowCountryModal(true)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCountryModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {newProduct.shipping_from_country && (
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, shipping_from_country: '' })}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-3 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Stock Status</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                    <input
                          type="checkbox"
                          checked={newProduct.is_available}
                          onChange={(e) => setNewProduct({ ...newProduct, is_available: e.target.checked })}
                          className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                        />
                        <span className="text-green-400 text-sm">Available</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newProduct.is_active}
                          onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
                          className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                        />
                        <span className="text-green-400 text-sm">Active</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Shipping To Countries */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-green-400 text-sm">Shipping To Countries</label>
                    <button
                      type="button"
                      onClick={() => setShowShippingToCountriesModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Country
                    </button>
                  </div>
                  
                  {/* Selected Countries */}
                  {Array.isArray(newProduct.shipping_to_countries) && newProduct.shipping_to_countries.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {newProduct.shipping_to_countries.map((countryCode: string) => (
                        <div key={countryCode} className="bg-gray-800 border border-gray-600 rounded p-2 flex items-center justify-between">
                          <span className="text-green-400 text-xs font-medium">
                            {Country.getCountryByCode(countryCode)?.name || countryCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeShippingToCountry(setNewProduct, newProduct, countryCode)}
                            className="text-red-400 hover:text-red-300 text-xs ml-2"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-gray-800 border border-gray-600 rounded">
                      <p className="text-gray-400 text-sm">No countries selected</p>
                      <p className="text-gray-500 text-xs mt-1">Click "Add Country" to get started</p>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.shipping_worldwide}
                      onChange={(e) => setNewProduct({ ...newProduct, shipping_worldwide: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">Worldwide</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.shipping_eu}
                      onChange={(e) => setNewProduct({ ...newProduct, shipping_eu: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">EU</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.shipping_us}
                      onChange={(e) => setNewProduct({ ...newProduct, shipping_us: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">US</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.shipping_uk}
                      onChange={(e) => setNewProduct({ ...newProduct, shipping_uk: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">UK</span>
                  </label>
                </div>
              </div>

              {/* Enhanced Shipping Methods */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <h5 className="font-semibold text-white text-sm">Shipping Methods</h5>
                  <button
                    type="button"
                    onClick={() => setShowShippingModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Method
                  </button>
                </div>
                
                {/* Selected Shipping Methods */}
                {Array.isArray(newProduct.shipping_methods) && newProduct.shipping_methods.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {newProduct.shipping_methods.map((method: string) => (
                    <div key={method} className="bg-gray-800 border border-gray-600 rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-green-400 text-sm font-medium">{method}</span>
                          <button
                            type="button"
                            onClick={() => removeShippingMethod(setNewProduct, newProduct, method)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-800 border border-gray-600 rounded">
                    <p className="text-gray-400 text-sm">No shipping methods selected</p>
                    <p className="text-gray-500 text-xs mt-1">Click "Add Method" to get started</p>
                  </div>
                )}
                      </div>
                      
              {/* Shipping Costs */}
              <div className="grid md:grid-cols-3 gap-4">
                        <div>
                  <label className="block text-green-400 text-sm mb-2">Shipping Cost USD</label>
                          <input
                            type="number"
                            step="0.01"
                    value={newProduct.shipping_cost_usd}
                    onChange={(e) => setNewProduct({ ...newProduct, shipping_cost_usd: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                  <label className="block text-green-400 text-sm mb-2">Shipping Cost BTC</label>
                          <input
                            type="number"
                            step="0.00000001"
                    value={newProduct.shipping_cost_btc}
                    onChange={(e) => setNewProduct({ ...newProduct, shipping_cost_btc: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                            placeholder="0.00000000"
                          />
                        </div>
                        <div>
                  <label className="block text-green-400 text-sm mb-2">Shipping Cost XMR</label>
                          <input
                            type="number"
                            step="0.000000000001"
                    value={newProduct.shipping_cost_xmr}
                    onChange={(e) => setNewProduct({ ...newProduct, shipping_cost_xmr: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                            placeholder="0.000000000000"
                          />
                </div>
              </div>

              {/* Policies */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Refund Policy</label>
                  <textarea
                    value={newProduct.refund_policy}
                    onChange={(e) => setNewProduct({ ...newProduct, refund_policy: e.target.value })}
                    rows={3}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Refund policy details..."
                  />
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Package Lost Policy</label>
                  <textarea
                    value={newProduct.package_lost_policy}
                    onChange={(e) => setNewProduct({ ...newProduct, package_lost_policy: e.target.value })}
                    rows={3}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Package lost policy details..."
                  />
                </div>
              </div>

              {/* Additional Options */}
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newProduct.accepts_monero}
                    onChange={(e) => setNewProduct({ ...newProduct, accepts_monero: e.target.checked })}
                    className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                  />
                  <span className="text-green-400 text-sm">Accepts Monero</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newProduct.is_available}
                    onChange={(e) => setNewProduct({ ...newProduct, is_available: e.target.checked })}
                    className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                  />
                  <span className="text-green-400 text-sm">Available for Purchase</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-6 py-3 rounded font-bold transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 w-full max-w-4xl mx-4 my-8">
            <h3 className="text-xl font-bold text-white mb-4">Edit Product</h3>
            <form onSubmit={handleUpdateProduct} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Vendor *</label>
                  <select
                    value={editingProduct.vendor_id}
                    onChange={(e) => setEditingProduct({ ...editingProduct, vendor_id: e.target.value })}
                    required
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.username}
                        {vendor.country && ` (${getCountryFlag(vendor.country)} ${getCountryName(vendor.country)})`}
                        {vendor.id === currentUser?.id && ' (You)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    required
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Product title..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-green-400 text-sm mb-2">Description *</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  placeholder="Product description..."
                />
              </div>

              {/* Pricing Section */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Price BTC *</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={editingProduct.price_btc}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price_btc: e.target.value })}
                    required
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="0.00000000"
                  />
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Price USD</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price_usd || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price_usd: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Price XMR</label>
                  <input
                    type="number"
                    step="0.000000000001"
                    value={editingProduct.price_xmr || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price_xmr: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="0.000000000000"
                  />
                </div>
              </div>

              {/* Additional Pricing Currencies */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Pricing</h3>
                
                {/* Primary Currencies */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price BTC *</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={editingProduct.price_btc}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_btc: e.target.value })}
                      required
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00000000"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price USD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_usd || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_usd: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price XMR</label>
                    <input
                      type="number"
                      step="0.000000000001"
                      value={editingProduct.price_xmr || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_xmr: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.000000000000"
                    />
                  </div>
                </div>

                {/* Additional Currencies */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price GBP</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_gbp || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_gbp: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price EUR</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_eur || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_eur: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price CAD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_cad || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_cad: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price AUD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_aud || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_aud: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* More Currencies */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price JPY</label>
                    <input
                      type="number"
                      step="1"
                      value={editingProduct.price_jpy || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_jpy: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price CNY</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_cny || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_cny: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price INR</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_inr || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_inr: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price BRL</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_brl || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_brl: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Regional Currencies */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price MXN</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_mxn || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_mxn: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price NGN</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_ngn || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_ngn: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price GHS</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_ghs || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_ghs: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price KES</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_kes || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_kes: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Additional Regional Currencies */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price ZAR</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_zar || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_zar: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price RUB</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_rub || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_rub: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Price TRY</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price_try || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price_try: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Category Section */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Category *</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value, subcategory_id: '' })}
                    required
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Subcategory</label>
                  <select
                    value={editingProduct.subcategory_id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subcategory_id: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    disabled={!editingProduct.category}
                  >
                    <option value="">Select subcategory...</option>
                    {subcategories
                      .filter(sub => sub.categories?.name === editingProduct.category)
                      .map(subcategory => (
                        <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-green-400 text-sm mb-2">Product Images</label>
                
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center mb-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    Select images from your device (JPG, PNG, GIF - Max 5MB each)
                  </p>
                      <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setEditingProduct, editingProduct)}
                    className="hidden"
                    id="file-upload-edit"
                    disabled={uploadingImages}
                  />
                  <label
                    htmlFor="file-upload-edit"
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded font-bold cursor-pointer transition-colors ${
                      uploadingImages 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        SELECT IMAGES
                      </>
                    )}
                  </label>
                </div>

                {/* Display Uploaded Images */}
                {editingProduct.image_urls && editingProduct.image_urls.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">Uploaded Images ({editingProduct.image_urls.length})</h4>
                      <button
                        type="button"
                        onClick={() => clearAllImages(setEditingProduct, editingProduct)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {editingProduct.image_urls.map((url: string, index: number) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-gray-600"
                          />
                  <button
                    type="button"
                            onClick={() => removeImage(index, setEditingProduct, editingProduct)}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                            <X className="w-3 h-3" />
                  </button>
                </div>
                      ))}
              </div>
                </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="space-y-4">
                <h4 className="font-bold text-white">Stock Status</h4>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.is_available}
                      onChange={(e) => setEditingProduct({ ...editingProduct, is_available: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">Available</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.is_active}
                      onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">Active</span>
                  </label>
                </div>
              </div>

              {/* Shipping Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-white">Shipping Options</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Ships From</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProduct.shipping_from_country ? Country.getCountryByCode(editingProduct.shipping_from_country)?.name || editingProduct.shipping_from_country : ''}
                        placeholder="Select country..."
                        readOnly
                        className="flex-1 bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none cursor-pointer"
                        onClick={() => setShowCountryModal(true)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCountryModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {editingProduct.shipping_from_country && (
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, shipping_from_country: '' })}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-3 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping To Countries */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-green-400 text-sm">Shipping To Countries</label>
                    <button
                      type="button"
                      onClick={() => setShowShippingToCountriesModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Country
                    </button>
                  </div>
                  
                  {/* Selected Countries */}
                  {editingProduct.shipping_to_countries && editingProduct.shipping_to_countries.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {editingProduct.shipping_to_countries.map((countryCode: string) => (
                        <div key={countryCode} className="bg-gray-800 border border-gray-600 rounded p-2 flex items-center justify-between">
                          <span className="text-green-400 text-xs font-medium">
                            {Country.getCountryByCode(countryCode)?.name || countryCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeShippingToCountry(setEditingProduct, editingProduct, countryCode)}
                            className="text-red-400 hover:text-red-300 text-xs ml-2"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                  ) : (
                    <div className="text-center py-3 bg-gray-800 border border-gray-600 rounded">
                      <p className="text-gray-400 text-sm">No countries selected</p>
                      <p className="text-gray-500 text-xs mt-1">Click "Add Country" to get started</p>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Shipping Cost USD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.shipping_cost_usd || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shipping_cost_usd: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Shipping Cost BTC</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={editingProduct.shipping_cost_btc || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shipping_cost_btc: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00000000"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Shipping Cost BTC</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={editingProduct.shipping_cost_btc || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shipping_cost_btc: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.00000000"
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Shipping Cost XMR</label>
                    <input
                      type="number"
                      step="0.000000000001"
                      value={editingProduct.shipping_cost_xmr || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shipping_cost_xmr: e.target.value })}
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="0.000000000000"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.shipping_worldwide}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shipping_worldwide: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">Worldwide</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.shipping_eu}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shipping_eu: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">EU</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.shipping_us}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shipping_us: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">US</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.shipping_uk}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shipping_uk: e.target.checked })}
                      className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-400 text-sm">UK</span>
                  </label>
                </div>

                {/* Enhanced Shipping Methods */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-white text-sm">Shipping Methods</h5>
                    <button
                      type="button"
                      onClick={() => setShowShippingModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Method
                    </button>
                  </div>
                  
                  {/* Selected Shipping Methods */}
                  {editingProduct.shipping_methods && editingProduct.shipping_methods.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                      {editingProduct.shipping_methods.map((method: string) => (
                      <div key={method} className="bg-gray-800 border border-gray-600 rounded p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-green-400 text-sm font-medium">{method}</span>
                            <button
                              type="button"
                              onClick={() => removeShippingMethod(setEditingProduct, editingProduct, method)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-800 border border-gray-600 rounded">
                      <p className="text-gray-400 text-sm">No shipping methods selected</p>
                      <p className="text-gray-500 text-xs mt-1">Click "Add Method" to get started</p>
                    </div>
                  )}
                </div>
                        </div>
                        
              {/* Shipping Costs */}
              <div className="grid md:grid-cols-3 gap-4">
                          <div>
                  <label className="block text-green-400 text-sm mb-2">Shipping Cost USD</label>
                            <input
                              type="number"
                              step="0.01"
                    value={editingProduct.shipping_cost_usd || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shipping_cost_usd: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                  <label className="block text-green-400 text-sm mb-2">Shipping Cost BTC</label>
                            <input
                              type="number"
                              step="0.00000001"
                    value={editingProduct.shipping_cost_btc || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shipping_cost_btc: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                              placeholder="0.00000000"
                            />
                          </div>
                          <div>
                  <label className="block text-green-400 text-sm mb-2">Shipping Cost XMR</label>
                            <input
                              type="number"
                              step="0.000000000001"
                    value={editingProduct.shipping_cost_xmr || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shipping_cost_xmr: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                              placeholder="0.000000000000"
                            />
                </div>
              </div>

              {/* Minimum Order Amounts */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Minimum Order USD</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.minimum_order_amount_usd || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minimum_order_amount_usd: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Minimum Order XMR</label>
                  <input
                    type="number"
                    step="0.000000000001"
                    value={editingProduct.minimum_order_amount_xmr || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minimum_order_amount_xmr: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="0.000000000000"
                  />
                </div>
              </div>

              {/* Listing Type and Unit Type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Listing Type</label>
                  <select
                    value={editingProduct.listing_type || 'escrow'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, listing_type: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="escrow">Escrow</option>
                    <option value="standard">Standard</option>
                    <option value="auction">Auction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Unit Type</label>
                  <select
                    value={editingProduct.unit_type || 'piece'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit_type: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="piece">Piece</option>
                    <option value="gram">Gram</option>
                    <option value="ounce">Ounce</option>
                    <option value="pound">Pound</option>
                    <option value="kilogram">Kilogram</option>
                    <option value="liter">Liter</option>
                    <option value="gallon">Gallon</option>
                  </select>
                </div>
              </div>

              {/* Policies */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Refund Policy</label>
                  <textarea
                    value={editingProduct.refund_policy || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, refund_policy: e.target.value })}
                    rows={3}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Refund policy details..."
                  />
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Package Lost Policy</label>
                  <textarea
                    value={editingProduct.package_lost_policy || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, package_lost_policy: e.target.value })}
                    rows={3}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Package lost policy details..."
                  />
                </div>
              </div>

              {/* Additional Options */}
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.accepts_monero}
                    onChange={(e) => setEditingProduct({ ...editingProduct, accepts_monero: e.target.checked })}
                    className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                  />
                  <span className="text-green-400 text-sm">Accepts Monero</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold transition-colors"
                >
                  Update Product
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Methods Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add Shipping Method</h3>
              <button
                onClick={() => setShowShippingModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Predefined Methods */}
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="block text-green-400 text-sm mb-2">Search Predefined Methods</label>
                <input
                  type="text"
                  value={shippingSearchTerm}
                  onChange={(e) => setShippingSearchTerm(e.target.value)}
                  placeholder="Search shipping methods..."
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>

              {/* Predefined Methods */}
              <div>
                <h4 className="font-semibold text-white mb-3">Predefined Methods</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {getFilteredShippingMethods().map((method) => (
                    <button
                      key={method}
                      onClick={() => {
                        if (editingProduct) {
                          addShippingMethod(setEditingProduct, editingProduct, method);
                        } else {
                          addShippingMethod(setNewProduct, newProduct, method);
                        }
                      }}
                      className="text-left p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-green-400 hover:text-green-300 transition-colors"
                    >
                      {method}
                    </button>
                  ))}
                </div>
                {getFilteredShippingMethods().length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">No methods found or all methods already selected</p>
                )}
              </div>

              {/* Custom Method */}
              <div className="border-t border-gray-600 pt-6">
                <h4 className="font-semibold text-white mb-3">Add Custom Method</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-green-400 text-sm mb-1">Method Name</label>
                    <input
                      type="text"
                      value={customShippingMethod}
                      onChange={(e) => setCustomShippingMethod(e.target.value)}
                      placeholder="Enter custom shipping method name"
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      if (editingProduct) {
                        addCustomShippingMethod(setEditingProduct, editingProduct);
                      } else {
                        addCustomShippingMethod(setNewProduct, newProduct);
                      }
                    }}
                    disabled={!customShippingMethod.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded font-bold transition-colors"
                  >
                    Add Custom Method
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-600">
              <button
                onClick={() => setShowShippingModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-2 rounded font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Country Selection Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Select Ship From Country</h3>
              <button
                onClick={() => setShowCountryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Countries */}
            <div className="space-y-6">
              <div>
                <label className="block text-green-400 text-sm mb-2">Search Countries</label>
                <input
                  type="text"
                  value={countrySearchTerm}
                  onChange={(e) => setCountrySearchTerm(e.target.value)}
                  placeholder="Search by country name or code..."
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>

              {/* Country List */}
              <div>
                <h4 className="font-semibold text-white mb-3">Available Countries</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {getFilteredCountries().map((country) => (
                    <button
                      key={country.isoCode}
                      onClick={() => {
                        if (editingProduct) {
                          setEditingProduct({ ...editingProduct, shipping_from_country: country.isoCode });
                        } else {
                          setNewProduct({ ...newProduct, shipping_from_country: country.isoCode });
                        }
                        setShowCountryModal(false);
                        setCountrySearchTerm('');
                      }}
                      className="text-left p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-green-400 hover:text-green-300 transition-colors"
                    >
                      <div className="font-medium">{country.name}</div>
                      <div className="text-xs text-gray-400">{country.isoCode}</div>
                    </button>
                  ))}
                </div>
                {getFilteredCountries().length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">No countries found</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-600">
              <button
                onClick={() => {
                  setShowCountryModal(false);
                  setCountrySearchTerm('');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-2 rounded font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping To Countries Modal */}
      {showShippingToCountriesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-500 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Select Shipping To Countries</h3>
              <button
                onClick={() => setShowShippingToCountriesModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Countries */}
            <div className="space-y-6">
              <div>
                <label className="block text-green-400 text-sm mb-2">Search Countries</label>
                <input
                  type="text"
                  value={shippingToCountriesSearchTerm}
                  onChange={(e) => setShippingToCountriesSearchTerm(e.target.value)}
                  placeholder="Search by country name or code..."
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                />
              </div>

              {/* Country List */}
              <div>
                <h4 className="font-semibold text-white mb-3">Available Countries</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {getFilteredShippingToCountries().map((country) => (
                    <button
                      key={country.isoCode}
                      onClick={() => {
                        if (editingProduct) {
                          addShippingToCountry(setEditingProduct, editingProduct, country.isoCode);
                        } else {
                          addShippingToCountry(setNewProduct, newProduct, country.isoCode);
                        }
                        setShowShippingToCountriesModal(false);
                        setShippingToCountriesSearchTerm('');
                      }}
                      className="text-left p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-green-400 hover:text-green-300 transition-colors"
                    >
                      <div className="font-medium">{country.name}</div>
                      <div className="text-xs text-gray-400">{country.isoCode}</div>
                    </button>
                  ))}
                </div>
                {getFilteredShippingToCountries().length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">No countries found or all countries already selected</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-600">
              <button
                onClick={() => {
                  setShowShippingToCountriesModal(false);
                  setShippingToCountriesSearchTerm('');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-2 rounded font-bold transition-colors"
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