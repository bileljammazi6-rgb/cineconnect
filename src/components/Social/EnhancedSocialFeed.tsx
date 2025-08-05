import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Globe, Users, Trash2, UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  hashtags?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  users: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  post_likes?: { user_id: string }[];
  post_comments?: {
    id: string;
    content: string;
    created_at: string;
    users: {
      username: string;
      full_name?: string;
    };
  }[];
}

interface Follow {
  following_id: string;
}

export const EnhancedSocialFeed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [following, setFollowing] = useState<Follow[]>([]);
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchFollowing();
      subscribeToUpdates();
    }
  }, [user, filter]);

  const fetchPosts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          users (id, username, full_name, avatar_url),
          post_likes (user_id),
          post_comments (
            id,
            content,
            created_at,
            users (username, full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (filter === 'following') {
        const followingIds = following.map(f => f.following_id);
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    setFollowing(data || []);
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('posts_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const extractHashtags = (text: string): string[] => {
    const hashtags = text.match(/#\w+/g);
    return hashtags ? hashtags.map(tag => tag.toLowerCase()) : [];
  };

  const createPost = async () => {
    if (!user || !newPost.trim()) return;

    try {
      const hashtags = extractHashtags(newPost);
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: newPost.trim(),
        hashtags: hashtags.length > 0 ? hashtags : null
      });

      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
      } else {
        setNewPost('');
        toast.success('Post created successfully!');
        fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      const existingLike = post?.post_likes?.find(like => like.user_id === user.id);

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
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;
      }

      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    try {
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        content: newComment[postId].trim()
      });

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      fetchPosts();
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const toggleFollow = async (userId: string) => {
    if (!user) return;

    try {
      const isFollowing = following.some(f => f.following_id === userId);

      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        toast.success('Unfollowed user');
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: userId });

        if (error) throw error;
        toast.success('Following user');
      }

      fetchFollowing();
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const renderHashtags = (hashtags: string[]) => {
    if (!hashtags || hashtags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {hashtags.map((tag, index) => (
          <span
            key={index}
            className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view the social feed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            All Posts
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'following'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Following
          </button>
        </div>

        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind? Use #hashtags to categorize your post..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-sm text-gray-500">
            {extractHashtags(newPost).length > 0 && (
              <span>Hashtags: {extractHashtags(newPost).join(', ')}</span>
            )}
          </span>
          <button
            onClick={createPost}
            disabled={!newPost.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Post
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm border animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-6 shadow-sm border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.users.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {post.users.full_name || post.users.username}
                    </h3>
                    <p className="text-sm text-gray-500">
                      @{post.users.username} • {formatDistanceToNow(new Date(post.created_at))} ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.user_id !== user.id && (
                    <button
                      onClick={() => toggleFollow(post.user_id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                        following.some(f => f.following_id === post.user_id)
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {following.some(f => f.following_id === post.user_id) ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                  {post.user_id === user.id && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                {post.hashtags && renderHashtags(post.hashtags)}
              </div>

              <div className="flex items-center gap-6 py-2 border-t border-gray-100">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-2 transition-colors ${
                    post.post_likes?.some(like => like.user_id === user.id)
                      ? 'text-red-600 hover:text-red-700'
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      post.post_likes?.some(like => like.user_id === user.id) ? 'fill-current' : ''
                    }`}
                  />
                  <span className="text-sm">{post.likes_count}</span>
                </button>

                <button
                  onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.comments_count}</span>
                </button>

                <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm">Share</span>
                </button>
              </div>

              <AnimatePresence>
                {showComments[post.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <div className="space-y-3 mb-4">
                      {post.post_comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {comment.users.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-gray-900">
                                  {comment.users.full_name || comment.users.username}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(comment.created_at))} ago
                                </span>
                              </div>
                              <p className="text-gray-800 text-sm">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addComment(post.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => addComment(post.id)}
                        disabled={!newComment[post.id]?.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Post
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {posts.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {filter === 'following' 
                  ? "No posts from people you follow yet. Try following some users or switch to 'All Posts'."
                  : "No posts yet. Be the first to share something!"
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
