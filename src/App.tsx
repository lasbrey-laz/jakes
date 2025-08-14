import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MapPin, Skull } from 'lucide-react';
import { Country, State } from 'country-state-city';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Categories from './pages/Categories';
import ProductDetail from './pages/ProductDetail';
import Vendors from './pages/Vendors';
import Orders from './pages/Orders';
import Wallet from './pages/Wallet';
import Support from './pages/Support';
import BecomeVendor from './pages/BecomeVendor';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminVendors from './pages/admin/AdminVendors';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import GlobalAlert from './components/GlobalAlert';

interface LocationData {
  country: string;
  state: string;
}

function App() {
  const [locationSelected, setLocationSelected] = useState(() => {
    const savedLocation = localStorage.getItem('userLocation');
    return !!savedLocation;
  });
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const location = JSON.parse(savedLocation);
      return location.country || '';
    }
    return '';
  });
  const [selectedState, setSelectedState] = useState(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const location = JSON.parse(savedLocation);
      return location.state || '';
    }
    return '';
  });
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Get supported countries with their states
  const supportedCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'AU'];
  const countries = Country.getAllCountries()
    .filter(country => supportedCountries.includes(country.isoCode))
    .map(country => ({
      code: country.isoCode,
      name: country.name,
      states: State.getStatesOfCountry(country.isoCode)
    }));
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (user: any) => {
    if (!user) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsAdmin(data.is_admin || false);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const handleLocationSubmit = () => {
    if (selectedCountry && selectedState) {
      const locationData = { country: selectedCountry, state: selectedState };
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      setLocationSelected(true);
    }
  };

  const handleLocationChange = (newCountry: string, newState: string) => {
    const locationData = { country: newCountry, state: newState };
    localStorage.setItem('userLocation', JSON.stringify(locationData));
    setSelectedCountry(newCountry);
    setSelectedState(newState);
  };

  if (!locationSelected) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center relative overflow-hidden">
        {/* Matrix-like background effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-900/20 to-black"></div>
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-green-500 text-xs animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              {Math.random().toString(36).substring(7)}
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-green-500 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 relative z-10">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Skull className="w-12 h-12 text-red-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">SECURE MARKET</h1>
            <p className="text-green-300 text-sm">Access Restricted - Location Verification Required</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-green-400 text-sm mb-2">Select Country:</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedState('');
                }}
                className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none"
              >
                <option value="">Choose your country...</option>
                {countries.map(country => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
            </div>

            {selectedCountry && (
              <div>
                <label className="block text-green-400 text-sm mb-2">Select State/Region:</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none"
                >
                  <option value="">Choose your state/region...</option>
                  {countries.find(c => c.code === selectedCountry)?.states.map(state => (
                    <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleLocationSubmit}
              disabled={!selectedCountry || !selectedState}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white p-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              ENTER MARKET
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Location verification ensures compliance with local regulations
            </p>
            <p className="text-xs text-yellow-400 mt-2">
              Browse freely • Account creation optional
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes - Require Authentication */}
        <Route path="/admin/*" element={
          checkingAdmin ? (
            <div className="text-white p-10">Checking access...</div>
          ) : user && isAdmin ? (
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/products" element={<AdminProducts />} />
                <Route path="/categories" element={<AdminCategories />} />
                <Route path="/vendors" element={<AdminVendors />} />
                <Route path="/orders" element={<AdminOrders />} />
                <Route path="/users" element={<AdminUsers />} />
              </Routes>
            </AdminLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />

        {/* Public Routes - No Authentication Required */}
        <Route path="/*" element={
          <Layout 
            selectedCountry={selectedCountry} 
            selectedState={selectedState} 
            isAdmin={isAdmin}
            onLocationChange={handleLocationChange}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/support" element={<Support />} />
              <Route path="/become-vendor" element={<BecomeVendor />} />
              {/* Protected Routes - Require Authentication */}
              <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
              <Route path="/wallet" element={user ? <Wallet /> : <Navigate to="/login" />} />
            </Routes>
          </Layout>
        } />
      </Routes>
      <GlobalAlert />
    </Router>
  );
}

export default App;