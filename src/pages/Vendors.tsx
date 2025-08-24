import React, { useState, useEffect } from 'react';
import { Star, Shield, Clock, Search, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Breadcrumbs, { BreadcrumbItem } from '../components/Breadcrumbs';

export default function Vendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('reputation');
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('all');

  // Use the same countries as the location selector
  const countries = [
    { code: 'all', name: 'All Countries', flag: '🌍' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' }
  ];

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        // No auth required - public data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_vendor', true)
          .eq('is_active', true)
          .eq('vendor_status', 'approved'); 

        if (error) {
          console.error('Error fetching vendors:', error);
          setVendors([]);
        } else {
          setVendors(data || []);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || vendor.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    switch (sortBy) {
      case 'reputation':
        return (b.reputation_score ?? 0) - (a.reputation_score ?? 0);
      case 'sales':
        return (b.total_sales ?? 0) - (a.total_sales ?? 0);
      case 'products':
        return (b.products ?? 0) - (a.products ?? 0);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  const getVendorCountByCountry = (countryCode: string) => {
    if (countryCode === 'all') return vendors.length;
    return vendors.filter(vendor => vendor.country === countryCode).length;
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-red-400 mb-4">VENDORS</h1>
            <p className="text-gray-400">Verified sellers in our secure marketplace</p>
            <p className="text-gray-500 text-sm mt-2">
              <span className="text-yellow-400">Note:</span> Browse vendors freely. Login required only for purchases.
            </p>
          </div>
          
          {/* Breadcrumbs */}
          <div className="flex-shrink-0">
            <Breadcrumbs
              items={[
                { label: 'Vendors', icon: Users }
              ]}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Country Tabs */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {countries.map((country) => (
            <button
              key={country.code}
              onClick={() => setSelectedCountry(country.code)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedCountry === country.code
                  ? 'bg-green-600 text-white border border-green-500'
                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-green-500'
              }`}
            >
              <span className="text-lg">{country.flag}</span>
              <span>{country.name}</span>
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                {getVendorCountByCountry(country.code)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
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
            <option value="reputation">Highest Reputation</option>
            <option value="sales">Most Sales</option>
            <option value="products">Most Products</option>
            <option value="newest">Newest</option>
          </select>

          {/* Stats */}
          <div className="text-center">
            <span className="text-green-400 font-bold">{sortedVendors.length}</span>
            <span className="text-gray-400 text-sm ml-1">vendors found</span>
            {selectedCountry !== 'all' && (
              <div className="text-xs text-gray-500 mt-1">
                in {countries.find(c => c.code === selectedCountry)?.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-500 text-center">Loading vendors...</p>}

      {/* Vendors Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading &&
          sortedVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-gray-900 border border-gray-700 hover:border-green-500 rounded-lg p-6 cursor-pointer transition-all hover:bg-gray-800"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">🛡️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 
                      className="font-bold text-green-400 hover:text-green-300 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vendor/${vendor.id}`);
                      }}
                    >
                      {vendor.username}
                    </h3>
                    {vendor.is_verified && <Shield className="w-4 h-4 text-blue-400" title="Verified Vendor" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-yellow-400 font-bold">{vendor.reputation_score ?? 0}</span>
                    <span className="text-gray-500 text-sm">(reputation)</span>
                  </div>
                  {/* Country Display */}
                  {vendor.country && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">
                        {countries.find(c => c.code === vendor.country)?.name || vendor.country}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4">{vendor.description ?? 'No description available'}</p>

              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="text-red-400 font-bold">N/A</div>
                  <div className="text-gray-500 text-xs">Products</div>
                </div>
                <div>
                  <div className="text-green-400 font-bold">N/A</div>
                  <div className="text-gray-500 text-xs">Sales</div>
                </div>
                <div>
                  <div className="text-yellow-400 font-bold">
                    {Math.floor((Date.now() - new Date(vendor.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
                  </div>
                  <div className="text-gray-500 text-xs">Active</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/vendor/${vendor.id}`);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold text-sm transition-colors"
                >
                  VIEW STORE
                </button>
                <button className="px-4 bg-gray-700 hover:bg-gray-600 text-green-400 py-2 rounded font-bold text-sm transition-colors">
                  MESSAGE
                </button>
              </div>

              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Joined {new Date(vendor.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {!loading && sortedVendors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No vendors found matching your criteria</p>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => setSearchTerm('')}
              className="text-red-400 hover:text-red-300 font-bold mr-4"
            >
              Clear Search
            </button>
            <button
              onClick={() => setSelectedCountry('all')}
              className="text-green-400 hover:text-green-300 font-bold"
            >
              Show All Countries
            </button>
          </div>
        </div>
      )}
    </>
  );
}