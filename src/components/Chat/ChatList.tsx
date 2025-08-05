import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Users, Online, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  last_seen: string | null;
  is_online: boolean;
  full_name?: string;
}

interface LastMessage {
  content: string;
  created_at: string;
  sender_id: string;
  read: boolean;
}

interface ChatPreview extends User {
  lastMessage?: LastMessage;
  unreadCount: number;
}

interface ChatListProps {
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
}

export function ChatList({ onSelectUser, selectedUserId }: ChatListProps) {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const { user } = useAuth();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (user) {
      fetchChats();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers();
      }, 300);
    } else {
      setSearchResults([]);
      setSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      
      // Get users who have exchanged messages with current user
      const { data: messageUsers, error: messageError } = await supabase
        .from('messages')
        .select(`
          sender_id,
          receiver_id,
          content,
          created_at,
          read,
          sender:sender_id(id, username, email, avatar_url, last_seen, is_online, full_name),
          receiver:receiver_id(id, username, email, avatar_url, last_seen, is_online, full_name)
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (messageError) throw messageError;

      // Process messages to get unique chat previews
      const chatMap = new Map<string, ChatPreview>();
      
      messageUsers?.forEach((msg: any) => {
        const otherUser = msg.sender_id === user?.id ? msg.receiver : msg.sender;
        if (!otherUser || chatMap.has(otherUser.id)) return;

        const unreadCount = messageUsers.filter(m => 
          m.sender_id === otherUser.id && 
          m.receiver_id === user?.id && 
          !m.read
        ).length;

        chatMap.set(otherUser.id, {
          ...otherUser,
          lastMessage: {
            content: msg.content,
            created_at: msg.created_at,
            sender_id: msg.sender_id,
            read: msg.read
          },
          unreadCount
        });
      });

      setChats(Array.from(chatMap.values()));
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, avatar_url, last_seen, is_online, full_name')
        .neq('id', user?.id)
        .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('chat-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `or(sender_id.eq.${user?.id},receiver_id.eq.${user?.id})`
      }, () => {
        fetchChats(); // Refresh chats when new messages arrive
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, () => {
        fetchChats(); // Refresh when user status changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleUserSelect = (selectedUser: User) => {
    onSelectUser(selectedUser);
    setSearchTerm('');
    setShowNewChat(false);
  };

  const getLastMessagePreview = (lastMessage: LastMessage | undefined, userId: string) => {
    if (!lastMessage) return 'No messages yet';
    
    const isFromMe = lastMessage.sender_id === user?.id;
    const prefix = isFromMe ? 'You: ' : '';
    const content = lastMessage.content.length > 30 
      ? lastMessage.content.substring(0, 30) + '...'
      : lastMessage.content;
    
    return prefix + content;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-green-500 text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Chats</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewChat(!showNewChat)}
            className="p-2 hover:bg-green-600 rounded-full transition-colors"
          >
            {showNewChat ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </motion.button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searchTerm && (searchResults.length > 0 || searching) && (
          <div className="border-b border-gray-200">
            <div className="p-3 bg-gray-50 text-sm font-medium text-gray-600">
              Search Results
            </div>
            {searching ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {searchResults.map((searchUser) => (
                  <motion.div
                    key={searchUser.id}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => handleUserSelect(searchUser)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      {searchUser.avatar_url ? (
                        <img
                          src={searchUser.avatar_url}
                          alt={searchUser.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {searchUser.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {searchUser.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {searchUser.full_name || searchUser.username}
                        </p>
                        {searchUser.is_online && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">@{searchUser.username}</p>
                      <p className="text-xs text-gray-400 truncate">{searchUser.email}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat List */}
        <div className="divide-y divide-gray-100">
          <AnimatePresence>
            {chats.length === 0 && !searchTerm ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-1">No conversations yet</p>
                <p className="text-sm">Search for users to start chatting!</p>
              </div>
            ) : (
              chats.map((chat) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  onClick={() => handleUserSelect(chat)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    selectedUserId === chat.id ? 'bg-green-50 border-r-4 border-green-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    {chat.avatar_url ? (
                      <img
                        src={chat.avatar_url}
                        alt={chat.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {chat.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {chat.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium truncate ${
                          chat.unreadCount > 0 ? 'text-gray-900' : 'text-gray-800'
                        }`}>
                          {chat.full_name || chat.username}
                        </p>
                        {chat.is_online && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(chat.lastMessage.created_at)}
                          </span>
                        )}
                        {chat.unreadCount > 0 && (
                          <div className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm truncate ${
                      chat.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                    }`}>
                      {getLastMessagePreview(chat.lastMessage, chat.id)}
                    </p>
                    
                    {!chat.is_online && chat.last_seen && (
                      <p className="text-xs text-gray-400">
                        Last seen {formatDistanceToNow(new Date(chat.last_seen), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}