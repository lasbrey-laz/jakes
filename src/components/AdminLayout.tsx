import React, { useState, useEffect } from 'react';
import {
  Skull,
  Settings,
  Package,
  Users,
  ShoppingCart,
  Tags,
  UserCheck,
  BarChart3,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/admin', icon: BarChart3, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/categories', icon: Tags, label: 'Categories' },
    { path: '/admin/vendors', icon: UserCheck, label: 'Vendors' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/users', icon: Users, label: 'Users' }
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-black text-green-400 font-mono">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-green-500 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Skull className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-lg font-bold text-red-400">ADMIN PANEL</h1>
              <p className="text-xs text-gray-400">Secure Market</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-green-400 hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="mb-4">
            <p className="text-green-400 text-sm font-semibold">{user?.email}</p>
            <p className="text-gray-500 text-xs">Administrator</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-green-400 px-3 py-2 rounded text-sm font-bold transition-colors"
            >
              SITE
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-bold transition-colors flex items-center justify-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-white">
                {menuItems.find((item) => isActive(item.path))?.label || 'Admin Panel'}
              </h2>
            </div>
            <div className="text-sm text-gray-400">
              {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
