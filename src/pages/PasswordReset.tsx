import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Skull, Eye, EyeOff, Shield, ArrowLeft, Mail, Lock } from 'lucide-react';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if we're in reset mode (user clicked email link)
  React.useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    if (accessToken && refreshToken) {
      setIsResetMode(true);
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset`,
      });

      if (error) throw error;
      
      setSuccess('Password reset email sent! Check your inbox and spam folder.');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
          <h1 className="text-2xl font-bold text-red-400 mb-2">
            {isResetMode ? 'RESET PASSWORD' : 'PASSWORD RESET'}
          </h1>
          <p className="text-green-300 text-sm">
            {isResetMode 
              ? 'Enter your new password' 
              : 'Enter your email to receive reset instructions'
            }
          </p>
        </div>

        {!isResetMode ? (
          // Request Reset Form
          <form onSubmit={handleRequestReset} className="space-y-6">
            <div>
              <label className="block text-green-400 text-sm mb-2">Email:</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none pl-12"
                  placeholder="Enter your email..."
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 p-3 rounded">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-900/20 border border-green-500 p-3 rounded">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white p-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {loading ? 'SENDING...' : 'SEND RESET EMAIL'}
            </button>
          </form>
        ) : (
          // Reset Password Form
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label className="block text-green-400 text-sm mb-2">New Password:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none pl-12 pr-12"
                  placeholder="Enter new password..."
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-green-400 text-sm mb-2">Confirm Password:</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:border-red-500 focus:outline-none pl-12 pr-12"
                  placeholder="Confirm new password..."
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 p-3 rounded">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-900/20 border border-green-500 p-3 rounded">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white p-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-green-400 hover:text-red-400 text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            All communications are encrypted end-to-end
          </p>
        </div>
      </div>
    </div>
  );
}
