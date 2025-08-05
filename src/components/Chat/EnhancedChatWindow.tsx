import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MapPin, Smile, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: 'text' | 'location' | 'image';
  location_data?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  image_url?: string;
  is_read: boolean;
  is_edited?: boolean;
  created_at: string;
  sender: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  message_reactions?: {
    id: string;
    emoji: string;
    user_id: string;
  }[];
}

interface EnhancedChatWindowProps {
  selectedUser: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

export const EnhancedChatWindow: React.FC<EnhancedChatWindowProps> = ({ selectedUser }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ['❤️', '👍', '😂', '😮', '😢', '😡'];

  useEffect(() => {
    if (selectedUser && user) {
      fetchMessages();
      subscribeToMessages();
      markMessagesAsRead();
    }
  }, [selectedUser, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedUser || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (username, full_name, avatar_url),
          message_reactions (id, emoji, user_id)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user.id})`)
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

  const subscribeToMessages = () => {
    if (!selectedUser || !user) return;

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user.id}))`
      }, fetchMessages)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      }, fetchMessages)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser || !user) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', selectedUser.id)
      .eq('recipient_id', user.id)
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: selectedUser.id,
        content: newMessage.trim(),
        message_type: 'text'
      });

      if (error) throw error;

      setNewMessage('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const editMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: editContent.trim(),
          is_edited: true
        })
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) throw error;

      setEditingMessage(null);
      setEditContent('');
      fetchMessages();
      toast.success('Message updated!');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) throw error;

      fetchMessages();
      toast.success('Message deleted!');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const existingReaction = messages
        .find(m => m.id === messageId)
        ?.message_reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

      if (existingReaction) {
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji
          });
      }

      fetchMessages();
      setShowEmojiPicker(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const shareLocation = async () => {
    if (!selectedUser || !user) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            recipient_id: selectedUser.id,
            content: 'Shared location',
            message_type: 'location',
            location_data: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });

          if (error) throw error;
          toast.success('Location shared!');
        } catch (error) {
          console.error('Error sharing location:', error);
          toast.error('Failed to share location');
        }
      }, () => {
        toast.error('Failed to get location');
      });
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-600">Choose someone to start chatting with</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {selectedUser.username[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {selectedUser.full_name || selectedUser.username}
            </h3>
            <p className="text-sm text-gray-500">@{selectedUser.username}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              const reactionGroups = message.message_reactions?.reduce((acc, reaction) => {
                if (!acc[reaction.emoji]) acc[reaction.emoji] = [];
                acc[reaction.emoji].push(reaction);
                return acc;
              }, {} as Record<string, typeof message.message_reactions>) || {};

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`group relative px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {editingMessage === message.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={`w-full p-2 rounded resize-none ${
                              isOwn ? 'bg-blue-700 text-white placeholder-blue-200' : 'bg-white'
                            }`}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => editMessage(message.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessage(null);
                                setEditContent('');
                              }}
                              className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {message.message_type === 'location' ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>Location shared</span>
                              </div>
                              {message.location_data && (
                                <a
                                  href={`https://maps.google.com/?q=${message.location_data.latitude},${message.location_data.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-sm underline ${
                                    isOwn ? 'text-blue-200' : 'text-blue-600'
                                  }`}
                                >
                                  View on map
                                </a>
                              )}
                            </div>
                          ) : (
                            <>
                              <p className="break-words">{message.content}</p>
                              {message.is_edited && (
                                <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                                  (edited)
                                </span>
                              )}
                            </>
                          )}

                          {isOwn && editingMessage !== message.id && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingMessage(message.id);
                                    setEditContent(message.content);
                                  }}
                                  className="p-1 hover:bg-blue-700 rounded"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteMessage(message.id)}
                                  className="p-1 hover:bg-red-600 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {Object.keys(reactionGroups).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(reactionGroups).map(([emoji, reactions]) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(message.id, emoji)}
                            className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                              reactions.some(r => r.user_id === user?.id)
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{reactions.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatDistanceToNow(new Date(message.created_at))} ago
                      </p>
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                        className={`text-xs ${isOwn ? 'text-blue-200 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <Smile className="w-3 h-3" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showEmojiPicker === message.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute z-10 bg-white border border-gray-200 rounded-lg p-2 shadow-lg mt-1"
                        >
                          <div className="flex gap-1">
                            {emojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(message.id, emoji)}
                                className="p-1 hover:bg-gray-100 rounded text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={shareLocation}
              className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
