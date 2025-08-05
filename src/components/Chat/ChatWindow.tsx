import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, MapPin, Smile, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { formatDistanceToNow } from 'date-fns';
import { ImageUpload } from './ImageUpload';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  last_seen: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read?: boolean;
}

interface ChatWindowProps {
  selectedUser: User;
}

export function ChatWindow({ selectedUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { location, getCurrentLocation } = useLocation();

  useEffect(() => {
    if (selectedUser && user) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [selectedUser, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', selectedUser.id)
        .eq('recipient_id', user?.id)
        .eq('read', false);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user?.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user?.id}))`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedUser.id,
          content: content.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendLocation = async () => {
    if (!location) {
      await getCurrentLocation();
      return;
    }

    const locationMessage = `📍 Location: ${location.city ? `${location.city}, ` : ''}${location.country || 'Unknown'}\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    await sendMessage(locationMessage);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              {isOnline(selectedUser.last_seen) && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{selectedUser.username}</h3>
              <p className="text-sm text-gray-500">
                {isOnline(selectedUser.last_seen) ? 'Online' : 
                  selectedUser.last_seen ? `Last seen ${formatDistanceToNow(new Date(selectedUser.last_seen), { addSuffix: true })}` : 'Offline'
                }
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender_id === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setShowImageUpload(true)}
                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={sendLocation}
                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <MapPin className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUpload
          onClose={() => setShowImageUpload(false)}
          onUpload={(imageUrl) => {
            sendMessage(`📷 Image: ${imageUrl}`);
            setShowImageUpload(false);
          }}
        />
      )}
    </div>
  );
}