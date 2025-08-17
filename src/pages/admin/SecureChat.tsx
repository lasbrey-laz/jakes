import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Shield, Crown, Clock, AlertCircle, Eye, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showGlobalError, showGlobalSuccess } from '../../components/CustomAlert';

export default function SecureChat() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.is_super_admin) {
      fetchChatUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      markMessagesAsRead(selectedUser.id);
    }
  }, [selectedUser]);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile?.is_super_admin) {
        setCurrentUser(profile);
      } else {
        showGlobalError('Access denied. Only super admins can access secure chat.');
      }
    }
    setLoading(false);
  };

  const fetchChatUsers = async () => {
    try {
      // Get all users who have sent messages to vendors or received messages from vendors
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey (id, username, email, is_vendor),
          receiver:profiles!chat_messages_receiver_id_fkey (id, username, email, is_vendor),
          products (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process users and their last messages
      const usersMap = new Map<string, any>();
      
      messagesData?.forEach((msg: any) => {
        const customerId = msg.sender.is_vendor ? msg.receiver_id : msg.sender_id;
        const vendorId = msg.sender.is_vendor ? msg.sender_id : msg.receiver_id;
        const customer = msg.sender.is_vendor ? msg.receiver : msg.sender;
        const vendor = msg.sender.is_vendor ? msg.sender : msg.receiver;
        
        const chatKey = `${customerId}-${vendorId}`;
        
        if (!usersMap.has(chatKey)) {
          usersMap.set(chatKey, {
            chatKey,
            customerId,
            vendorId,
            customerName: customer.username,
            customerEmail: customer.email,
            vendorName: vendor.username,
            vendorEmail: vendor.email,
            lastMessage: msg.message,
            lastMessageTime: msg.created_at,
            productTitle: msg.products?.title,
            unreadCount: 0
          });
        } else {
          const existingChat = usersMap.get(chatKey)!;
          if (new Date(msg.created_at) > new Date(existingChat.lastMessageTime)) {
            existingChat.lastMessage = msg.message;
            existingChat.lastMessageTime = msg.created_at;
            existingChat.productTitle = msg.products?.title;
          }
        }
      });

      // Calculate unread counts
      const unreadCounts = await Promise.all(
        Array.from(usersMap.values()).map(async (chat) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact' })
            .eq('sender_id', chat.customerId)
            .eq('receiver_id', chat.vendorId)
            .eq('is_read', false);
          
          chat.unreadCount = count || 0;
          return chat;
        })
      );

      setChatUsers(Array.from(usersMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      ));
    } catch (error) {
      console.error('Error fetching chat users:', error);
      showGlobalError('Error fetching chat users');
    }
  };

  const fetchMessages = async (chatKey: string) => {
    try {
      const chat = chatUsers.find(c => c.chatKey === chatKey);
      if (!chat) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey (username, is_vendor),
          products (title)
        `)
        .or(`and(sender_id.eq.${chat.customerId},receiver_id.eq.${chat.vendorId}),and(sender_id.eq.${chat.vendorId},receiver_id.eq.${chat.customerId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showGlobalError('Error fetching messages');
    }
  };

  const markMessagesAsRead = async (chatKey: string) => {
    try {
      const chat = chatUsers.find(c => c.chatKey === chatKey);
      if (!chat) return;

      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('sender_id', chat.customerId)
        .eq('receiver_id', chat.vendorId)
        .eq('is_read', false);
      
      // Update unread count in chat users
      setChatUsers(prev => prev.map(c => 
        c.chatKey === chatKey ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setSending(true);
    try {
      const chat = chatUsers.find(c => c.chatKey === selectedUser.chatKey);
      if (!chat) return;

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: currentUser.id,
          receiver_id: chat.customerId,
          message: newMessage.trim(),
          is_read: false
        }]);

      if (error) throw error;

      setNewMessage('');
      // Refresh messages
      fetchMessages(selectedUser.chatKey);
      // Update chat users list
      fetchChatUsers();
      
      showGlobalSuccess('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      showGlobalError('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const filteredChats = chatUsers.filter(chat =>
    chat.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.vendorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.productTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser?.is_super_admin) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg">Access Denied</div>
        <p className="text-gray-400">Only super admins can access secure chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading secure chat...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-400" />
            Secure Chat
          </h1>
          <p className="text-gray-400">Communicate with customers and handle complaints</p>
        </div>
        <div className="flex items-center gap-2 text-yellow-400">
          <Crown className="w-5 h-5" />
          <span className="text-sm font-bold">SUPER ADMIN ACCESS</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats by customer, vendor, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-gray-600 text-green-400 px-4 py-2 rounded focus:border-green-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        {/* Chat Users List */}
        <div className="bg-gray-900 border border-green-500 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-white">Customer-Vendor Chats</h3>
          </div>
          
          <div className="overflow-y-auto h-[calc(70vh-120px)]">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No chat conversations found</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.chatKey}
                  onClick={() => setSelectedUser(chat)}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors ${
                    selectedUser?.chatKey === chat.chatKey ? 'bg-green-900/20 border-green-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">{chat.customerName}</div>
                        <div className="text-gray-400 text-xs">{chat.customerEmail}</div>
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-gray-400 text-xs">Vendor: {chat.vendorName}</div>
                    {chat.productTitle && (
                      <div className="text-gray-400 text-xs">Product: {chat.productTitle}</div>
                    )}
                  </div>
                  
                  {chat.lastMessage && (
                    <div className="text-gray-400 text-xs truncate">
                      {chat.lastMessage}
                    </div>
                  )}
                  
                  <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(chat.lastMessageTime).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 bg-gray-900 border border-green-500 rounded-lg overflow-hidden">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{selectedUser.customerName}</div>
                      <div className="text-gray-400 text-sm">{selectedUser.customerEmail}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Vendor: {selectedUser.vendorName}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="overflow-y-auto h-[calc(70vh-200px)] p-4 space-y-4">
                {messages.length === 0 ? (
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
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Select a chat to start messaging</p>
                <p className="text-gray-500">Choose from the list on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
          <div>
            <h4 className="font-bold text-red-400 mb-2">Security Notice</h4>
            <p className="text-gray-300 text-sm">
              This is a secure communication channel for super admins only. All conversations are logged and monitored.
              Handle customer complaints professionally and maintain platform security standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
