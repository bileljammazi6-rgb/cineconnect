import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Users, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  last_seen: string | null;
}

interface ChatListProps {
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
}

export function ChatList({ onSelectUser, selectedUserId }: ChatListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, last_seen')
        .neq('id', user?.id)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  if (loading) {
    return (
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-12 h-12 mb-2" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredUsers.map((chatUser) => (
              <motion.button
                key={chatUser.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectUser(chatUser)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedUserId === chatUser.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {chatUser.username.charAt(0).toUpperCase()}
                    </div>
                    {isOnline(chatUser.last_seen) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {chatUser.username}
                      </h3>
                      {chatUser.last_seen && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(chatUser.last_seen), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <div className={`w-2 h-2 rounded-full ${
                        isOnline(chatUser.last_seen) ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      {isOnline(chatUser.last_seen) ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}