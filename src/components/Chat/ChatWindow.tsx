import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, Phone, Video, MoreVertical, ArrowLeft, Smile, Paperclip } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ImageUpload } from './ImageUpload';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  last_seen: string | null;
  is_online: boolean;
  full_name?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  read: boolean;
}

interface ChatWindowProps {
  selectedUser: User;
  onBack?: () => void;
}

export function ChatWindow({ selectedUser, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (selectedUser && user) {
      fetchMessages();
      markMessagesAsRead();
      setupRealtimeSubscription();
    }
  }, [selectedUser, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [newMessage]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user?.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user?.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', selectedUser.id)
        .eq('receiver_id', user?.id)
        .eq('read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat-${selectedUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${user?.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user?.id}))`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new as Message]);
          if (payload.new.sender_id === selectedUser.id) {
            markMessagesAsRead();
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id ? payload.new as Message : msg
          ));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    // Validate message length
    if (newMessage.length > 1000) {
      toast.error('Message is too long (max 1000 characters)');
      return;
    }

    try {
      setSending(true);
      const messageContent = newMessage.trim();
      setNewMessage('');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: selectedUser.id,
          content: messageContent,
          read: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(newMessage); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const shouldShowDateHeader = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();
    
    return currentDate !== previousDate;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="lg:hidden p-1 hover:bg-green-600 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}
          
          <div className="relative">
            {selectedUser.avatar_url ? (
              <img
                src={selectedUser.avatar_url}
                alt={selectedUser.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {(selectedUser.full_name || selectedUser.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {selectedUser.is_online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white border-2 border-green-500 rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {selectedUser.full_name || selectedUser.username}
            </h3>
            <p className="text-sm text-green-100 truncate">
              {selectedUser.is_online 
                ? 'Online' 
                : selectedUser.last_seen 
                  ? `Last seen ${formatDistanceToNow(new Date(selectedUser.last_seen), { addSuffix: true })}`
                  : 'Offline'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-green-600 rounded-full transition-colors"
            >
              <Phone className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-green-600 rounded-full transition-colors"
            >
              <Video className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-green-600 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isFromMe = message.sender_id === user?.id;
            const previousMessage = index > 0 ? messages[index - 1] : undefined;
            const showDate = shouldShowDateHeader(message, previousMessage);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-600 shadow-sm">
                      {formatMessageDate(message.created_at)}
                    </div>
                  </div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-1`}
                >
                  <div
                    className={`max-w-[70%] lg:max-w-md px-3 py-2 rounded-2xl shadow-sm ${
                      isFromMe
                        ? 'bg-green-500 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md'
                    }`}
                  >
                    {message.image_url && (
                      <img
                        src={message.image_url}
                        alt="Shared image"
                        className="rounded-lg mb-2 max-w-full h-auto"
                      />
                    )}
                    
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.content}
                    </p>
                    
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      isFromMe ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      <span className="text-xs">
                        {formatMessageTime(message.created_at)}
                      </span>
                      {isFromMe && (
                        <div className="text-xs">
                          {message.read ? '✓✓' : '✓'}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 bg-gray-100 border-none rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm leading-relaxed"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={sending}
            />
            
            {newMessage.length > 0 && (
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {newMessage.length}/1000
              </div>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
          >
            <Smile className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-2 rounded-full transition-colors ${
              newMessage.trim() && !sending
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
        
        {showImageUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <ImageUpload
              onUpload={(url) => {
                // Handle image upload
                setShowImageUpload(false);
              }}
              onClose={() => setShowImageUpload(false)}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}