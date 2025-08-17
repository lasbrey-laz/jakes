import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Skull, Eye, EyeOff, Shield } from 'lucide-react';
import { useReferralTracking } from '../hooks/useReferralTracking';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { markConversion } = useReferralTracking();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: (await supabase.auth.getUser()).data.user?.id,
              username,
              email,
              is_vendor: false,
              reputation_score: 0
            }
          ]);
        
        if (profileError) throw profileError;
        
        // Mark referral conversion if user came through a referral link
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await markConversion(user.id, 'signup');
        }
        
        navigate('/');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center relative overflow-hidden">
      {/* Matrix background */}
      <div className="absolute inset-0 opacity-10">
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
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Skull className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">SECURE ACCESS</h1>
          <p className="text-green-300 text-sm">
            {isLogin ? 'Enter your credentials' : 'Create new account'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-green-400 text-sm mb-2">Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none"
                placeholder="Enter username..."
              />
            </div>
          )}

          <div>
            <label className="block text-green-400 text-sm mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none"
              placeholder="Enter email..."
            />
          </div>

          <div>
            <label className="block text-green-400 text-sm mb-2">Password:</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none pr-12"
                placeholder="Enter password..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 p-3 rounded">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white p-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {loading ? 'PROCESSING...' : (isLogin ? 'LOGIN' : 'REGISTER')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-400 hover:text-red-400 text-sm transition-colors"
          >
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/password-reset')}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            All communications are encrypted end-to-end
          </p>
        </div>
      </div>
    </div>
  );
}