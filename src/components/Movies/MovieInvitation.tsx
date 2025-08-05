import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, Clock, Check, X, Film } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface MovieInvitation {
  id: string;
  sender_id: string;
  recipient_id: string;
  movie_title: string;
  movie_url: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender: {
    username: string;
  };
  recipient: {
    username: string;
  };
}

interface User {
  id: string;
  username: string;
}

interface MovieInvitationProps {
  movieTitle: string;
  movieUrl: string;
  onClose: () => void;
}

export function MovieInvitation({ movieTitle, movieUrl, onClose }: MovieInvitationProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [message, setMessage] = useState('');
  const [invitations, setInvitations] = useState<MovieInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'received' | 'sent'>('send');

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
    subscribeToInvitations();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .neq('id', user?.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('movie_invitations')
        .select(`
          *,
          sender:sender_id(username),
          recipient:recipient_id(username)
        `)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const subscribeToInvitations = () => {
    const channel = supabase
      .channel('movie_invitations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'movie_invitations' },
        fetchInvitations
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('movie_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: selectedUser,
          movie_title: movieTitle,
          movie_url: movieUrl,
          message: message || `Let's watch ${movieTitle} together!`
        });

      if (error) throw error;
      
      toast.success('Movie invitation sent!');
      setSelectedUser('');
      setMessage('');
      setActiveTab('sent');
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (invitationId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('movie_invitations')
        .update({ status })
        .eq('id', invitationId);

      if (error) throw error;
      
      toast.success(`Invitation ${status}!`);
      
      if (status === 'accepted') {
        const invitation = invitations.find(inv => inv.id === invitationId);
        if (invitation) {
          // Open movie in new tab
          window.open(invitation.movie_url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error('Failed to respond to invitation');
    }
  };

  const receivedInvitations = invitations.filter(inv => 
    inv.recipient_id === user?.id && inv.status === 'pending'
  );

  const sentInvitations = invitations.filter(inv => 
    inv.sender_id === user?.id
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Film className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Movie Invitations</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Movie Info */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-white mb-2">{movieTitle}</h4>
            <p className="text-sm text-gray-400">Invite friends to watch this movie together!</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'send', label: 'Send Invite', icon: Send },
              { key: 'received', label: `Received (${receivedInvitations.length})`, icon: Users },
              { key: 'sent', label: 'Sent', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Send Invitation */}
          {activeTab === 'send' && (
            <form onSubmit={sendInvitation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Friend
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a friend...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Let's watch ${movieTitle} together!`}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={!selectedUser || loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          )}

          {/* Received Invitations */}
          {activeTab === 'received' && (
            <div className="space-y-4">
              {receivedInvitations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending invitations</p>
                </div>
              ) : (
                receivedInvitations.map((invitation) => (
                  <div key={invitation.id} className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-white">{invitation.movie_title}</h4>
                        <p className="text-sm text-gray-400">
                          From {invitation.sender.username} • {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {invitation.message && (
                      <p className="text-gray-300 mb-4">{invitation.message}</p>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => respondToInvitation(invitation.id, 'accepted')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Accept & Watch
                      </button>
                      <button
                        onClick={() => respondToInvitation(invitation.id, 'declined')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sent Invitations */}
          {activeTab === 'sent' && (
            <div className="space-y-4">
              {sentInvitations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No invitations sent</p>
                </div>
              ) : (
                sentInvitations.map((invitation) => (
                  <div key={invitation.id} className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{invitation.movie_title}</h4>
                        <p className="text-sm text-gray-400">
                          To {invitation.recipient.username} • {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                        </p>
                        {invitation.message && (
                          <p className="text-gray-300 mt-2">{invitation.message}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invitation.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        invitation.status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}