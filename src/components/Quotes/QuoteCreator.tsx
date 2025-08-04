import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Plus, Heart, Share2, Trash2, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface QuoteType {
  id: string;
  content: string;
  author: string;
  category: string;
  user_id: string;
  likes: number;
  created_at: string;
  users: {
    username: string;
  };
}

export function QuoteCreator() {
  const [quotes, setQuotes] = useState<QuoteType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteType | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    author: '',
    category: 'inspirational'
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const categories = [
    'inspirational',
    'motivational',
    'love',
    'wisdom',
    'humor',
    'success',
    'life',
    'friendship'
  ];

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          users (username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.content.trim()) return;

    setSubmitting(true);
    try {
      if (editingQuote) {
        const { error } = await supabase
          .from('quotes')
          .update({
            content: formData.content.trim(),
            author: formData.author.trim() || 'Anonymous',
            category: formData.category
          })
          .eq('id', editingQuote.id);

        if (error) throw error;
        toast.success('Quote updated successfully!');
      } else {
        const { error } = await supabase
          .from('quotes')
          .insert({
            content: formData.content.trim(),
            author: formData.author.trim() || 'Anonymous',
            category: formData.category,
            user_id: user.id
          });

        if (error) throw error;
        toast.success('Quote created successfully!');
      }

      setFormData({ content: '', author: '', category: 'inspirational' });
      setShowForm(false);
      setEditingQuote(null);
      fetchQuotes();
    } catch (error: any) {
      console.error('Error saving quote:', error);
      toast.error('Failed to save quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (quoteId: string) => {
    try {
      const { error } = await supabase.rpc('increment_quote_likes', {
        quote_id: quoteId
      });

      if (error) throw error;
      
      setQuotes(prev => prev.map(quote => 
        quote.id === quoteId 
          ? { ...quote, likes: quote.likes + 1 }
          : quote
      ));
    } catch (error) {
      console.error('Error liking quote:', error);
      toast.error('Failed to like quote');
    }
  };

  const handleDelete = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;
      
      setQuotes(prev => prev.filter(quote => quote.id !== quoteId));
      toast.success('Quote deleted successfully!');
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    }
  };

  const handleEdit = (quote: QuoteType) => {
    setEditingQuote(quote);
    setFormData({
      content: quote.content,
      author: quote.author,
      category: quote.category
    });
    setShowForm(true);
  };

  const handleShare = async (quote: QuoteType) => {
    const text = `"${quote.content}" - ${quote.author}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Inspiring Quote',
          text: text,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(text);
        toast.success('Quote copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Quote copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Quote className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-900">Quotes Collection</h1>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowForm(true);
            setEditingQuote(null);
            setFormData({ content: '', author: '', category: 'inspirational' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Quote
        </motion.button>
      </div>

      {/* Quote Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingQuote ? 'Edit Quote' : 'Create New Quote'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quote Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your inspiring quote..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name (optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Saving...' : (editingQuote ? 'Update Quote' : 'Create Quote')}
                </motion.button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingQuote(null);
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {quotes.map((quote) => (
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  quote.category === 'inspirational' ? 'bg-blue-100 text-blue-800' :
                  quote.category === 'motivational' ? 'bg-green-100 text-green-800' :
                  quote.category === 'love' ? 'bg-pink-100 text-pink-800' :
                  quote.category === 'wisdom' ? 'bg-purple-100 text-purple-800' :
                  quote.category === 'humor' ? 'bg-yellow-100 text-yellow-800' :
                  quote.category === 'success' ? 'bg-indigo-100 text-indigo-800' :
                  quote.category === 'life' ? 'bg-gray-100 text-gray-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {quote.category}
                </span>
                
                {quote.user_id === user?.id && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(quote)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(quote.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <blockquote className="text-gray-800 mb-4 italic">
                "{quote.content}"
              </blockquote>

              <div className="text-sm text-gray-600 mb-4">
                — {quote.author}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  By {quote.users.username} • {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleLike(quote.id)}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  {quote.likes}
                </button>
                
                <button
                  onClick={() => handleShare(quote)}
                  className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {quotes.length === 0 && (
        <div className="text-center py-12">
          <Quote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">No quotes yet</h3>
          <p className="text-gray-400">Be the first to create an inspiring quote!</p>
        </div>
      )}
    </div>
  );
}