import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Wallet as WalletIcon, Send, Download, Eye, EyeOff, Copy, RefreshCw, Shield } from 'lucide-react';
import { showGlobalError } from '../components/CustomAlert';

export default function Wallet() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showGlobalError('You must be logged in to access your wallet. Redirecting to login...');
      navigate('/login');
      return;
    }
    setUser(user);
  };
  const walletData = {
    btc: { balance: 0.15234567, usd: 6789.23 },
    eth: { balance: 2.45678901, usd: 4321.87 },
    ltc: { balance: 15.87654321, usd: 1234.56 }
  };

  const transactions = [
    { id: 1, type: 'received', amount: 0.00234567, currency: 'BTC', from: 'CryptoGuard', date: '2025-01-15', status: 'confirmed' },
    { id: 2, type: 'sent', amount: 0.00456789, currency: 'BTC', to: 'SecureComms', date: '2025-01-14', status: 'confirmed' },
    { id: 3, type: 'received', amount: 0.12345678, currency: 'ETH', from: 'DigitalLiberty', date: '2025-01-13', status: 'pending' },
    { id: 4, type: 'sent', amount: 1.23456789, currency: 'LTC', to: 'CryptoVault', date: '2025-01-12', status: 'confirmed' }
  ];

  const addresses = {
    btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    eth: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
    ltc: 'ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-400 mb-4">WALLET</h1>
        <p className="text-gray-400">Manage your cryptocurrency balances and transactions</p>
      </div>

      {/* Wallet Overview */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
            <WalletIcon className="w-6 h-6" />
            PORTFOLIO OVERVIEW
          </h2>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-gray-400 hover:text-green-400 transition-colors"
          >
            {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(walletData).map(([currency, data]) => (
            <div key={currency} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">{currency.toUpperCase()}</h3>
                <div className="text-2xl">
                  {currency === 'btc' ? '₿' : currency === 'eth' ? 'Ξ' : 'Ł'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-green-400 font-bold text-lg">
                  {showBalance ? data.balance.toFixed(8) : '••••••••'}
                </div>
                <div className="text-gray-400 text-sm">
                  ${showBalance ? data.usd.toFixed(2) : '••••••'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-6">
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            RECEIVE
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold flex items-center gap-2 transition-colors">
            <Send className="w-4 h-4" />
            SEND
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-green-400 px-6 py-3 rounded font-bold flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" />
            REFRESH
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border border-green-500 rounded-lg mb-8">
        <div className="flex border-b border-gray-700">
          {['overview', 'transactions', 'addresses'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-bold text-sm transition-colors ${
                activeTab === tab
                  ? 'text-red-400 border-b-2 border-red-400'
                  : 'text-gray-400 hover:text-green-400'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {transactions.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            tx.type === 'received' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <div className="text-green-400 font-semibold">
                              {tx.type === 'received' ? '+' : '-'}{tx.amount} {tx.currency}
                            </div>
                            <div className="text-gray-400 text-xs">{tx.date}</div>
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          tx.status === 'confirmed' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'
                        }`}>
                          {tx.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Security Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-500 rounded">
                      <Shield className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-green-400 font-semibold">2FA Enabled</div>
                        <div className="text-gray-400 text-xs">Two-factor authentication active</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-500 rounded">
                      <Shield className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-green-400 font-semibold">Wallet Encrypted</div>
                        <div className="text-gray-400 text-xs">Private keys secured</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 className="font-bold text-white mb-4">Transaction History</h3>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          tx.type === 'received' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="text-green-400 font-semibold">
                            {tx.type === 'received' ? 'Received' : 'Sent'}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {tx.type === 'received' ? `From: ${tx.from}` : `To: ${tx.to}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {tx.type === 'received' ? '+' : '-'}{tx.amount} {tx.currency}
                        </div>
                        <div className="text-gray-400 text-sm">{tx.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <h3 className="font-bold text-white mb-4">Receiving Addresses</h3>
              <div className="space-y-4">
                {Object.entries(addresses).map(([currency, address]) => (
                  <div key={currency} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-green-400">{currency.toUpperCase()} Address</h4>
                      <button
                        onClick={() => copyToClipboard(address)}
                        className="text-gray-400 hover:text-green-400 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-black border border-gray-600 rounded p-3 font-mono text-sm text-green-400 break-all">
                      {address}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}