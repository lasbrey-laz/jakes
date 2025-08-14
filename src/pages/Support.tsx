import React, { useState } from 'react';
import { MessageSquare, Shield, Clock, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export default function Support() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [newTicket, setNewTicket] = useState({ subject: '', category: '', message: '' });

  const tickets = [
    {
      id: 'TK-001234',
      subject: 'Payment not confirmed',
      category: 'Payment Issues',
      status: 'open',
      priority: 'high',
      created: '2025-01-15',
      lastUpdate: '2025-01-15',
      messages: 3
    },
    {
      id: 'TK-001235',
      subject: 'Account verification help',
      category: 'Account',
      status: 'resolved',
      priority: 'medium',
      created: '2025-01-14',
      lastUpdate: '2025-01-14',
      messages: 5
    }
  ];

  const faqs = [
    {
      question: 'How do I verify my account?',
      answer: 'Account verification requires submitting valid identification documents through our secure portal. The process typically takes 24-48 hours.',
      category: 'Account'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), and other major cryptocurrencies. Traditional payment methods are not supported.',
      category: 'Payments'
    },
    {
      question: 'How secure are my transactions?',
      answer: 'All transactions are encrypted end-to-end and processed through secure channels. We use military-grade encryption and never store sensitive payment information.',
      category: 'Security'
    },
    {
      question: 'Can I cancel an order?',
      answer: 'Orders can be cancelled within 1 hour of placement if the vendor has not yet confirmed the order. After confirmation, cancellation requires vendor approval.',
      category: 'Orders'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-400';
      case 'in-progress': return 'text-yellow-400';
      case 'resolved': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-900 text-red-400';
      case 'medium': return 'bg-yellow-900 text-yellow-400';
      case 'low': return 'bg-green-900 text-green-400';
      default: return 'bg-gray-900 text-gray-400';
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle ticket submission

    setNewTicket({ subject: '', category: '', message: '' });
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-400 mb-4">SUPPORT CENTER</h1>
        <p className="text-gray-400">Get help with your account, orders, and technical issues</p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border border-green-500 rounded-lg mb-8">
        <div className="flex border-b border-gray-700">
          {['tickets', 'new-ticket', 'faq', 'contact'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-bold text-sm transition-colors ${
                activeTab === tab
                  ? 'text-red-400 border-b-2 border-red-400'
                  : 'text-gray-400 hover:text-green-400'
              }`}
            >
              {tab.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'tickets' && (
            <div>
              <h3 className="font-bold text-white mb-6">My Support Tickets</h3>
              {tickets.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No support tickets found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-gray-800 border border-gray-700 hover:border-green-500 rounded-lg p-6 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-green-400 mb-1">{ticket.subject}</h4>
                          <p className="text-gray-400 text-sm">Ticket #{ticket.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                          <div className={`flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)}
                            <span className="text-sm font-bold">{ticket.status.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <div className="text-green-400">{ticket.category}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <div className="text-white">{ticket.created}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Update:</span>
                          <div className="text-white">{ticket.lastUpdate}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Messages:</span>
                          <div className="text-white">{ticket.messages}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'new-ticket' && (
            <div>
              <h3 className="font-bold text-white mb-6">Create New Support Ticket</h3>
              <form onSubmit={handleSubmitTicket} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Subject:</label>
                    <input
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      required
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                      placeholder="Brief description of your issue..."
                    />
                  </div>
                  <div>
                    <label className="block text-green-400 text-sm mb-2">Category:</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                      required
                      className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    >
                      <option value="">Select category...</option>
                      <option value="account">Account Issues</option>
                      <option value="payment">Payment Problems</option>
                      <option value="orders">Order Issues</option>
                      <option value="technical">Technical Support</option>
                      <option value="security">Security Concerns</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-green-400 text-sm mb-2">Message:</label>
                  <textarea
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    required
                    rows={6}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Provide detailed information about your issue..."
                  />
                </div>

                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded font-bold transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  SUBMIT TICKET
                </button>
              </form>
            </div>
          )}

          {activeTab === 'faq' && (
            <div>
              <h3 className="font-bold text-white mb-6">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <HelpCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-bold text-green-400 mb-2">{faq.question}</h4>
                        <p className="text-gray-300 text-sm leading-relaxed mb-3">{faq.answer}</p>
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                          {faq.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h3 className="font-bold text-white mb-6">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h4 className="font-bold text-green-400 mb-4">Emergency Contact</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-400">Security Issues:</span>
                        <div className="text-red-400 font-mono">security@securemarket.onion</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Response Time:</span>
                        <div className="text-white">Within 1 hour</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h4 className="font-bold text-green-400 mb-4">General Support</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-400">Support Email:</span>
                        <div className="text-green-400 font-mono">support@securemarket.onion</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Response Time:</span>
                        <div className="text-white">Within 24 hours</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <Shield className="w-6 h-6 text-red-400 mt-1" />
                    <div>
                      <h4 className="font-bold text-red-400 mb-3">Security Notice</h4>
                      <div className="space-y-2 text-gray-300 text-sm">
                        <p>• Never share your private keys or passwords</p>
                        <p>• Always verify URLs before entering credentials</p>
                        <p>• Report suspicious activity immediately</p>
                        <p>• Use secure communication channels only</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}