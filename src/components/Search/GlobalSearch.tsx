import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Film, Quote, MessageCircle, User, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface SearchResult {
  id: string;
  type: 'movie' | 'quote' | 'user' | 'message';
  title: string;
  subtitle?: string;
  image?: string;
  data?: any;
}

interface GlobalSearchProps {
  onSelectResult?: (result: SearchResult) => void;
}

export function GlobalSearch({ onSelectResult }: GlobalSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search quotes
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*, profiles(username)')
        .or(`content.ilike.%${query}%,author.ilike.%${query}%`)
        .limit(5);

      quotes?.forEach(quote => {
        searchResults.push({
          id: quote.id,
          type: 'quote',
          title: quote.content.substring(0, 100) + (quote.content.length > 100 ? '...' : ''),
          subtitle: `by ${quote.author}`,
          data: quote
        });
      });

      // Search users
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(5);

      users?.forEach(userProfile => {
        searchResults.push({
          id: userProfile.id,
          type: 'user',
          title: userProfile.username,
          subtitle: userProfile.bio?.substring(0, 50) || 'No bio',
          data: userProfile
        });
      });

      // Search messages (only user's own messages for privacy)
      if (user) {
        const { data: messages } = await supabase
          .from('messages')
          .select('*, users(username)')
          .eq('sender_id', user.id)
          .ilike('content', `%${query}%`)
          .limit(3);

        messages?.forEach(message => {
          searchResults.push({
            id: message.id,
            type: 'message',
            title: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
            subtitle: `Message from ${new Date(message.created_at).toLocaleDateString()}`,
            data: message
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film className="w-5 h-5 text-blue-400" />;
      case 'quote':
        return <Quote className="w-5 h-5 text-purple-400" />;
      case 'user':
        return <User className="w-5 h-5 text-green-400" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Search className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult?.(result);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search everything... (⌘K)"
          className="w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query.length > 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-sm border border-purple-500/20 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3"
                  >
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {result.title}
                      </h4>
                      {result.subtitle && (
                        <p className="text-xs text-gray-400 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 capitalize">
                      {result.type}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : query.length > 2 ? (
              <div className="p-4 text-center text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{query}"</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}