import React, { useState, useEffect } from 'react';
import { Skull, Wifi, WifiOff, MessageSquare, X, Send, Minimize2, Maximize2, Settings, ChevronRight, ChevronDown, MapPin, Star, User, Play } from 'lucide-react';
import { Country, State } from 'country-state-city';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  selectedCountry: string;
  selectedState: string;
  isAdmin?: boolean;
  onLocationChange: (country: string, state: string) => void;
}

export default function Layout({ children, selectedCountry, selectedState, isAdmin = false, onLocationChange }: LayoutProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Welcome to SecureMarket. How can we assist you today?", sender: "system", timestamp: new Date() }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempCountry, setTempCountry] = useState(selectedCountry);
  const [tempState, setTempState] = useState(selectedState);
  const navigate = useNavigate();
  const location = useLocation();


  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setTempCountry(selectedCountry);
    setTempState(selectedState);
  }, [selectedCountry, selectedState]);

  // Get subcategory counts
  const getSubcategoryCount = (categoryName: string) => {
    return subcategories.filter(sub => sub.categories?.name === categoryName).length;
  };

  // Get product count for subcategory
  const getSubcategoryProductCount = (subcategoryId: string) => {
    return products.filter(product => product.subcategory_id === subcategoryId).length;
  };

  const openLocationModal = () => {
    setTempCountry(selectedCountry);
    setTempState(selectedState);
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
  };

  const handleLocationSubmit = () => {
    if (tempCountry && tempState) {
      onLocationChange(tempCountry, tempState);
      closeLocationModal();
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch categories from backend
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch products to get counts and featured products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_vendor_id_fkey (username, reputation_score)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*, categories(name)')
        .order('name');

      if (subcategoriesError) {
        console.error('Error fetching subcategories:', subcategoriesError);
        return;
      }

      // Add product counts to categories
      const categoriesWithCounts = categoriesData?.map(category => ({
        ...category,
        count: productsData?.filter(product => product.category === category.name).length || 0
      })) || [];

      setCategories(categoriesWithCounts);
      setSubcategories(subcategoriesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error fetching vendors:', error);
      setCategories([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
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



  const handleCategoryClick = (categoryName: string) => {
    // Only toggle expansion, don't navigate
    toggleCategory(categoryName);
  };

  const handleSubcategoryClick = (subcategoryId: string, categoryName: string) => {
    navigate(`/categories?category=${encodeURIComponent(categoryName)}&subcategory=${subcategoryId}`);
  };
  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: chatMessages.length + 1,
        text: newMessage,
        sender: 'user',
        timestamp: new Date()
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');

      setTimeout(() => {
        const responses = [
          "Thank you for your message. An operator will assist you shortly.",
          "Your request has been noted. Please wait for further instructions.",
          "Message received. Maintaining secure connection...",
          "Processing your inquiry through encrypted channels..."
        ];
        const response = {
          id: chatMessages.length + 2,
          text: responses[Math.floor(Math.random() * responses.length)],
          sender: 'system',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, response]);
      }, 1000 + Math.random() * 2000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Get country and state names
  const countryName = Country.getCountryByCode(selectedCountry)?.name || selectedCountry;
  const stateName = State.getStateByCodeAndCountry(selectedState, selectedCountry)?.name || selectedState;

  if (loading) {
    return (
      <div className="text-center py-12 bg-black h-screen flex items-center justify-center">
        <div className="text-green-400 text-lg">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col">
      {/* Main Content Wrapper */}
      <div className={`flex-1 transition-all duration-300 flex flex-col`}>

        {/* Header */}
        <header className="bg-gray-900 border-b border-green-500 sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skull className="w-8 h-8 text-red-500" />
                <h1 className="text-xl font-bold text-red-400 cursor-pointer" onClick={() => navigate('/')}>
                  SECURE MARKET
                </h1>
                <div className="flex items-center gap-2 text-xs">
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">SECURE</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500" />
                      <span className="text-red-500">RECONNECTING...</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs">
                  <span className="text-gray-500">Location: </span>
                  <button
                    onClick={openLocationModal}
                    className="text-green-400 hover:text-blue-400 transition-colors cursor-pointer"
                    title="Click to change location"
                  >
                    {countryName}, {stateName}
                  </button>
                </div>

                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-sm">{user.email}</span>
                    {isAdmin && (
                      <button
                        onClick={() => navigate('/admin')}
                        className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" />
                        ADMIN
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold transition-colors"
                    >
                      LOGOUT
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold transition-colors"
                    >
                      LOGIN
                    </button>
                    <span className="text-gray-500 text-xs">Optional</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Security Panel */}
        <div className="bg-gradient-to-r from-red-900/20 via-red-800/30 to-red-900/20 border-y border-red-500/50 py-2">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-mono font-bold">SECURE CONNECTION</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-400 font-mono">ENCRYPTED CHANNEL</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 font-mono">TOR NETWORK</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-purple-400 font-mono">BLOCKCHAIN VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-gray-800 border-b border-gray-700 sticky">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center gap-8 text-sm">
              <button
                onClick={() => navigate('/')}
                className={`transition-colors ${isActive('/') ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              >
                HOME
              </button>
              <button
                onClick={() => navigate('/categories')}
                className={`transition-colors ${isActive('/categories') ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              >
                CATEGORIES
              </button>
              <button
                onClick={() => navigate('/vendors')}
                className={`transition-colors ${isActive('/vendors') ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              >
                VENDORS
              </button>
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/orders')}
                    className={`transition-colors ${isActive('/orders') ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
                  >
                    ORDERS
                  </button>
                  <button
                    onClick={() => navigate('/wallet')}
                    className={`transition-colors ${isActive('/wallet') ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
                  >
                    WALLET
                  </button>
                </>
              ) : (
                <span className="text-gray-600 text-xs">Login for Orders & Wallet</span>
              )}
              <button
                onClick={() => navigate('/support')}
                className={`transition-colors ${isActive('/support') ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              >
                SUPPORT
              </button>
              <button
                onClick={() => navigate('/become-vendor')}
                className={`transition-colors ${isActive('/become-vendor') ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              >
                BECOME VENDOR
              </button>
            </div>
          </div>
        </nav>

        {/* Main Section Below Navbar */}
        <div className="flex flex-1 min-h-0">

          {/* Sidebar - now under navbar, to the left */}
          <aside className={`bg-gradient-to-b from-gray-900 via-gray-800 to-black border-r-4 border-red-500 transition-all duration-300 w-80 hidden lg:block shadow-2xl flex flex-col h-screen`}>
            <div className="flex-shrink-0 p-6 text-center">
              <h1 className="text-xl font-black text-red-400 tracking-wider">CATEGORIES</h1>
            </div>
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900/90 to-black/90 sidebar-scrollbar" style={{ height: 'calc(100vh - 200px)' }}>

              {/* Individual Categories */}
              <div className="space-y-0">
                {categories.map((category, index) => {
                  const subs = subcategories.filter(sub => sub.categories?.name === category.name);
                  const isExpanded = expandedCategories.has(category.name);
                  const subcategoryCount = getSubcategoryCount(category.name);
                  const isEven = index % 2 === 0;

                  return (
                    <div key={category.id} className="group">
                      {/* Category Header */}
                      <div
                        className={`flex items-center cursor-pointer transition-all duration-300 p-4 w-full ${isEven
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-red-900/30 hover:bg-red-800/40'
                          }`}
                        onClick={() => handleCategoryClick(category.name)}
                      >


                        {/* Category Content */}
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl filter drop-shadow-lg">{category.icon || '💊'}</span>
                            <span className="font-black text-white tracking-wider text-shadow-sm">{category.name.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-red-400 font-black bg-red-900/50 px-2 py-1 rounded">{category.count}</span>
                          </div>
                        </div>
                        {/* Expand/Collapse Icon */}
                        <div
                          className="mr-3 w-6 h-6 flex justify-center items-center transition-transform duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(category.name);
                          }}
                        >
                          {subs.length > 0 && (
                            <Play 
                              className={`w-4 h-4 text-red-400 transform transition-transform duration-300 ${
                                isExpanded ? 'rotate-90' : 'rotate-0'
                              }`}
                            />
                          )}
                        </div>
                      </div>

                      {/* Subcategories Dropdown */}
                      {isExpanded && subs.length > 0 && (
                        <div className="animate-fadeIn">
                          {subs.map((sub, subIndex) => (
                            <div
                              key={sub.id}
                              onClick={() => handleSubcategoryClick(sub.id, category.name)}
                              className={`text-sm text-gray-300 hover:text-red-400 cursor-pointer p-4 w-full transition-all duration-300 flex items-center justify-between ${subIndex % 2 === 0
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-red-800/20 hover:bg-red-700/30'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{sub.icon || '💊'}</span>
                                <span className="font-semibold">{sub.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-red-400 font-bold bg-red-900/50 px-2 py-1 rounded">
                                  {getSubcategoryProductCount(sub.id)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Top Vendors Section */}
              <div className="pt-6 mt-8">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-black text-red-400 mb-2 tracking-wider flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-red-400" />
                    TOP VENDORS
                  </h3>
                  <div className="text-xs text-gray-400 font-mono">VERIFIED SELLERS</div>
                </div>
                <div className="space-y-0">
                  {/* Sample top vendors - you can make this dynamic */}
                  <div className="flex items-center justify-between p-4 w-full bg-gray-800 hover:bg-gray-700 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-bold tracking-wide">AMAZON4DRUGS</span>
                    </div>
                    <div className="text-red-400 font-black text-sm bg-red-900/50 px-2 py-1 rounded">100%</div>
                  </div>

                  <div className="flex items-center justify-between p-4 w-full bg-red-900/30 hover:bg-red-800/40 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-bold tracking-wide">ADDYRUS</span>
                    </div>
                    <div className="text-red-400 font-black text-sm bg-red-900/50 px-2 py-1 rounded">100%</div>
                  </div>
                </div>
              </div>
              
              {/* Copyright Section */}
              <div className="mt-auto pt-6 border-t border-gray-700">
                <div className="text-center p-4">
                  <div className="text-xs text-gray-500 font-mono mb-2">
                    © 2024 SECURE MARKET
                  </div>
                  <div className="text-xs text-gray-600 font-mono">
                    ENCRYPTED • ANONYMOUS • SECURE
                  </div>
                  <div className="text-xs text-gray-700 font-mono mt-1">
                    All rights reserved
                  </div>
                </div>
              </div>
              
              {/* Additional Spacing to Ensure Scrolling */}
              <div className="h-20"></div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 relative">
            {/* Floating Security Indicator */}
            <div className="absolute top-4 right-4 z-30">
              <div className="bg-gradient-to-r from-red-900/90 to-red-800/90 backdrop-blur-sm border-2 border-red-500/50 rounded-lg p-3 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="text-center">
                    <div className="text-xs text-green-400 font-mono font-bold">SECURITY STATUS</div>
                    <div className="text-xs text-red-300 font-mono">ACTIVE</div>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {children}
          </main>
        </div>


        {/* Sidebar Toggle Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed left-4 top-24 z-50 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Chat Widget */}
        <div className={`fixed bottom-4 right-4 z-50 ${chatOpen ? 'w-80' : 'w-auto'}`}>
          {!chatOpen ? (
            <button
              onClick={() => setChatOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-colors animate-pulse"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          ) : (
            <div className="bg-gray-900 border border-green-500 rounded-lg shadow-2xl overflow-hidden">
              <div className="bg-gray-800 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-bold text-sm">SECURE CHAT</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChatMinimized(!chatMinimized)}
                    className="text-gray-400 hover:text-green-400"
                  >
                    {chatMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setChatOpen(false)}
                    className={`fixed bottom-4 right-4 z-50 ${chatOpen ? 'w-80' : 'w-auto'} text-gray-400 hover:text-red-400`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {!chatMinimized && (
                <>
                  <div className="h-64 overflow-y-auto p-3 space-y-3 bg-black">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`text-xs ${message.sender === 'user'
                          ? 'text-green-400 text-right'
                          : 'text-gray-300'
                          }`}
                      >
                        <div className={`inline-block p-2 rounded ${message.sender === 'user'
                          ? 'bg-green-900/50'
                          : 'bg-gray-800'
                          }`}>
                          {message.text}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-gray-800 border-t border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type encrypted message..."
                        className="flex-1 bg-black border border-gray-600 text-green-400 p-2 rounded text-xs focus:border-green-500 focus:outline-none"
                      />
                      <button
                        onClick={sendMessage}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-700 mt-16">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center">
              <div className="flex justify-center items-center gap-2 mb-4">
                <Skull className="w-6 h-6 text-red-500" />
                <span className="text-red-400 font-bold">SECURE MARKET</span>
              </div>
              <p className="text-gray-500 text-xs mb-4">
                Encrypted • Anonymous • Secure
              </p>
              <div className="flex justify-center gap-6 text-xs text-gray-500">
                <a href="#" className="hover:text-green-400">Terms</a>
                <a href="#" className="hover:text-green-400">Privacy</a>
                <a href="#" className="hover:text-green-400">Security</a>
                <a href="#" className="hover:text-green-400">Contact</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Location Change Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-green-500 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <MapPin className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Change Location</h2>
                <p className="text-gray-400 text-sm">Update your location preferences</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Select Country:</label>
                  <select
                    value={tempCountry}
                    onChange={(e) => {
                      setTempCountry(e.target.value);
                      setTempState('');
                    }}
                    className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Choose your country...</option>
                    {Country.getAllCountries()
                      .filter(country => ['US', 'CA', 'GB', 'FR', 'DE', 'AU'].includes(country.isoCode))
                      .map(country => (
                        <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                      ))}
                  </select>
                </div>

                {tempCountry && (
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Select State/Region:</label>
                    <select
                      value={tempState}
                      onChange={(e) => setTempState(e.target.value)}
                      className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none"
                    >
                      <option value="">Choose your state/region...</option>
                      {State.getStatesOfCountry(tempCountry).map(state => (
                        <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeLocationModal}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLocationSubmit}
                    disabled={!tempCountry || !tempState}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white p-3 rounded font-bold transition-colors"
                  >
                    Update Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

