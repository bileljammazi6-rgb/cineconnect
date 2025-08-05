import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Globe, Users, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  user_id: string;
  content: string;
  visibility: 'public' | 'friends';
  likes: number;
  created_at: string;
  updated_at: string;
  users: {
    username: string;
    avatar_url?: string;
  };
  post_likes: Array<{
    user_id: string;
    users: {
      username: string;
    };
  }>;
  post_comments: Array<{
    id: string;
    content: string;
    created_at: string;
    users: {
      username: string;
    };
  }>;
}

export function SocialFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public');
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPosts();
    subscribeToUpdates();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (username, avatar_url),
          post_likes (
            user_id,
            users (username)
          ),
          post_comments (
            id,
            content,
            created_at,
            users (username)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('posts_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, fetchPosts)
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: newPost.trim(),
          visibility
        });

      if (error) throw error;
      
      setNewPost('');
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      const existingLike = posts
        .find(p => p.id === postId)
        ?.post_likes.find(l => l.user_id === user.id);

      if (existingLike) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;
      
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Create Post */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-purple-500/20"
      >
        <form onSubmit={createPost}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none border-none outline-none text-lg"
                rows={3}
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                      visibility === 'public'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('friends')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                      visibility === 'friends'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Friends
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!newPost.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Posts Feed */}
      <div className="space-y-6">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                    {post.users.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{post.users.username}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {post.visibility === 'public' ? (
                          <Globe className="w-3 h-3" />
                        ) : (
                          <Users className="w-3 h-3" />
                        )}
                        <span className="capitalize">{post.visibility}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {post.user_id === user?.id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <p className="text-white mb-4 leading-relaxed">{post.content}</p>

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      post.post_likes.some(l => l.user_id === user?.id)
                        ? 'text-red-500'
                        : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${
                      post.post_likes.some(l => l.user_id === user?.id) ? 'fill-current' : ''
                    }`} />
                    <span>{post.post_likes.length}</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.post_comments.length}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Comments Preview */}
              {post.post_comments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="space-y-3">
                    {post.post_comments.slice(0, 2).map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {comment.users.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-800 rounded-lg px-3 py-2">
                            <p className="text-sm font-medium text-white">{comment.users.username}</p>
                            <p className="text-sm text-gray-300">{comment.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {post.post_comments.length > 2 && (
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        View all {post.post_comments.length} comments
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPost(null)}
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
                  <h3 className="text-xl font-bold text-white">Comments</h3>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* All Comments */}
                <div className="space-y-4 mb-6">
                  {selectedPost.post_comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {comment.users.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-800 rounded-lg px-4 py-3">
                          <p className="font-medium text-white mb-1">{comment.users.username}</p>
                          <p className="text-gray-300">{comment.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-lg px-4 py-3 resize-none border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      rows={3}
                    />
                    <button
                      onClick={() => addComment(selectedPost.id)}
                      disabled={!newComment.trim()}
                      className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
