import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, User, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showGlobalError, showGlobalSuccess } from './CustomAlert';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
  productId?: string;
  productTitle?: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  product_id?: string;
  sender_profile?: {
    username: string;
    is_admin?: boolean;
    is_super_admin?: boolean;
  };
}

export default function ChatModal({ 
  isOpen, 
  onClose, 
  vendorId, 
  vendorName, 
  productId, 
  productTitle 
}: ChatModalProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkCurrentUser();
      fetchMessages();
    }
  }, [isOpen, vendorId]);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentUser(profile);
    }
  };

  const fetchMessages = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey (username, is_admin, is_super_admin)
        `)
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${vendorId}),and(sender_id.eq.${vendorId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showGlobalError('Error loading chat messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: currentUser.id,
          receiver_id: vendorId,
          message: newMessage.trim(),
          product_id: productId,
          is_read: false
        }]);

      if (error) throw error;

      setNewMessage('');
      // Refresh messages
      fetchMessages();
      
      showGlobalSuccess('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      showGlobalError('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async () => {
    if (!currentUser) return;

    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('sender_id', vendorId)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-900 border border-green-500 rounded-lg w-full max-w-2xl mx-4 my-8 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-white font-semibold">Chat with {vendorName}</div>
              {productTitle && (
                <div className="text-gray-400 text-sm">Re: {productTitle}</div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-green-400 text-lg">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No messages yet</p>
              <p className="text-gray-500 text-sm">Start the conversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === currentUser?.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div className="text-sm">{message.message}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-black border border-gray-600 text-white px-4 py-2 rounded focus:border-green-500 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
