import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  Check, 
  X, 
  Eye,
  Share2,
  Trophy,
  Star,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  created_by: string;
  created_at: string;
  ends_at: string;
  total_votes: number;
  is_active: boolean;
  poll_type: 'movie_night' | 'favorite_movie' | 'genre_preference' | 'watch_time';
  user?: {
    username: string;
    avatar_url?: string;
  };
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  movie_id?: number;
  movie_poster?: string;
  percentage: number;
  hasVoted?: boolean;
}

interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
}

const MoviePolls: React.FC = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    poll_type: 'movie_night' as Poll['poll_type'],
    duration: 24, // hours
    options: ['', '']
  });
  const [searchMovies, setSearchMovies] = useState<any[]>([]);
  const [movieSearchTerm, setMovieSearchTerm] = useState('');

  const CONFIG = {
    TMDB_API_KEY: import.meta.env.VITE_TMDB_API_KEY || "",
    TMDB_BASE_URL: "https://api.themoviedb.org/3"
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('movie_polls')
        .select(`
          *,
          user:created_by (username, avatar_url),
          poll_options (
            id,
            text,
            votes,
            movie_id,
            movie_poster
          ),
          poll_votes (
            id,
            option_id,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedPolls = data?.map(poll => {
        const totalVotes = poll.poll_options.reduce((sum: number, option: any) => sum + option.votes, 0);
        const userVotes = poll.poll_votes.filter((vote: any) => vote.user_id === user?.id);
        
        const processedOptions = poll.poll_options.map((option: any) => ({
          ...option,
          percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
          hasVoted: userVotes.some((vote: any) => vote.option_id === option.id)
        }));

        return {
          ...poll,
          options: processedOptions,
          total_votes: totalVotes
        };
      }) || [];

      setPolls(processedPolls);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const searchTMDBMovies = async (query: string) => {
    if (!query.trim() || !CONFIG.TMDB_API_KEY) return;
    
    try {
      const response = await fetch(
        `${CONFIG.TMDB_BASE_URL}/search/movie?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchMovies(data.results?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error searching movies:', error);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (movieSearchTerm) {
        searchTMDBMovies(movieSearchTerm);
      } else {
        setSearchMovies([]);
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [movieSearchTerm]);

  const createPoll = async () => {
    if (!user) {
      toast.error('Please sign in to create polls');
      return;
    }

    if (!newPoll.title.trim()) {
      toast.error('Please enter a poll title');
      return;
    }

    const validOptions = newPoll.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    try {
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + newPoll.duration);

      const { data: pollData, error: pollError } = await supabase
        .from('movie_polls')
        .insert({
          title: newPoll.title,
          description: newPoll.description,
          poll_type: newPoll.poll_type,
          created_by: user.id,
          ends_at: endsAt.toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (pollError) throw pollError;

      const optionsData = validOptions.map(option => ({
        poll_id: pollData.id,
        text: option,
        votes: 0
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData);

      if (optionsError) throw optionsError;

      toast.success('Poll created successfully! 🗳️');
      setShowCreatePoll(false);
      setNewPoll({
        title: '',
        description: '',
        poll_type: 'movie_night',
        duration: 24,
        options: ['', '']
      });
      fetchPolls();
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    }
  };

  const vote = async (pollId: string, optionId: string) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        toast.error('You have already voted in this poll');
        return;
      }

      // Add vote
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id
        });

      if (voteError) throw voteError;

      // Update vote count
      const { error: updateError } = await supabase.rpc(
        'increment_poll_votes',
        { option_id: optionId }
      );

      if (updateError) throw updateError;

      toast.success('Vote cast successfully! 🗳️');
      fetchPolls();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to cast vote');
    }
  };

  const addOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const addMovieOption = (movie: any) => {
    const movieOption = `${movie.title} (${new Date(movie.release_date).getFullYear()})`;
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, movieOption]
    }));
    setMovieSearchTerm('');
    setSearchMovies([]);
  };

  const isVotingEnded = (endsAt: string): boolean => {
    return new Date() > new Date(endsAt);
  };

  const timeRemaining = (endsAt: string): string => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getPollTypeEmoji = (type: Poll['poll_type']): string => {
    switch (type) {
      case 'movie_night': return '🍿';
      case 'favorite_movie': return '⭐';
      case 'genre_preference': return '🎭';
      case 'watch_time': return '⏰';
      default: return '🎬';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Loading polls...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8"
          >
            <BarChart3 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">🗳️ Movie Polls</h1>
            <p className="text-purple-200 mb-6">
              Vote on movie nights, share your preferences, and discover what others want to watch!
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreatePoll(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create Poll
            </motion.button>
          </motion.div>
        </div>

        {/* Create Poll Modal */}
        <AnimatePresence>
          {showCreatePoll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreatePoll(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Create New Poll</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-purple-200 mb-2">Poll Title</label>
                    <input
                      type="text"
                      value={newPoll.title}
                      onChange={(e) => setNewPoll(prev => ({...prev, title: e.target.value}))}
                      placeholder="What should we watch tonight?"
                      className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-300"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2">Description (Optional)</label>
                    <textarea
                      value={newPoll.description}
                      onChange={(e) => setNewPoll(prev => ({...prev, description: e.target.value}))}
                      placeholder="Add more details about your poll..."
                      rows={3}
                      className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-300"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-200 mb-2">Poll Type</label>
                      <select
                        value={newPoll.poll_type}
                        onChange={(e) => setNewPoll(prev => ({...prev, poll_type: e.target.value as Poll['poll_type']}))}
                        className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white"
                      >
                        <option value="movie_night">🍿 Movie Night</option>
                        <option value="favorite_movie">⭐ Favorite Movie</option>
                        <option value="genre_preference">🎭 Genre Preference</option>
                        <option value="watch_time">⏰ Watch Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-purple-200 mb-2">Duration (Hours)</label>
                      <input
                        type="number"
                        value={newPoll.duration}
                        onChange={(e) => setNewPoll(prev => ({...prev, duration: parseInt(e.target.value) || 24}))}
                        min="1"
                        max="168"
                        className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2">Poll Options</label>
                    <div className="space-y-3">
                      {newPoll.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-300"
                          />
                          {newPoll.options.length > 2 && (
                            <button
                              onClick={() => removeOption(index)}
                              className="p-3 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={addOption}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-xl transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </button>
                    </div>

                    {/* Movie Search */}
                    <div className="mt-4">
                      <input
                        type="text"
                        value={movieSearchTerm}
                        onChange={(e) => setMovieSearchTerm(e.target.value)}
                        placeholder="Search movies to add as options..."
                        className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-300"
                      />
                      
                      {searchMovies.length > 0 && (
                        <div className="mt-2 bg-white/10 rounded-xl p-4 max-h-48 overflow-y-auto">
                          {searchMovies.map((movie) => (
                            <button
                              key={movie.id}
                              onClick={() => addMovieOption(movie)}
                              className="w-full text-left p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                            >
                              {movie.title} ({new Date(movie.release_date).getFullYear()})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={createPoll}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl"
                  >
                    Create Poll
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreatePoll(false)}
                    className="px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 text-white rounded-xl"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Polls List */}
        <div className="space-y-6">
          {polls.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
              <p className="text-purple-200 text-lg">No polls yet. Be the first to create one!</p>
            </div>
          ) : (
            polls.map((poll) => (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getPollTypeEmoji(poll.poll_type)}</span>
                      <h3 className="text-xl font-bold text-white">{poll.title}</h3>
                      {isVotingEnded(poll.ends_at) && (
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                          Ended
                        </span>
                      )}
                    </div>
                    
                    {poll.description && (
                      <p className="text-purple-200 mb-3">{poll.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-purple-300">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {poll.total_votes} votes
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {timeRemaining(poll.ends_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>by @{poll.user?.username}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="p-2 text-purple-300 hover:bg-white/10 rounded-xl transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {poll.options.map((option, index) => {
                    const hasVoted = option.hasVoted;
                    const canVote = !isVotingEnded(poll.ends_at) && !hasVoted && user;
                    
                    return (
                      <motion.button
                        key={option.id}
                        whileHover={canVote ? { scale: 1.02 } : {}}
                        whileTap={canVote ? { scale: 0.98 } : {}}
                        onClick={() => canVote ? vote(poll.id, option.id) : undefined}
                        disabled={!canVote}
                        className={`w-full p-4 rounded-2xl transition-all duration-300 ${
                          hasVoted
                            ? 'bg-purple-500/30 border-2 border-purple-400'
                            : canVote
                            ? 'bg-white/10 hover:bg-white/20 border border-white/30'
                            : 'bg-white/5 border border-white/20 cursor-default'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-medium text-left">{option.text}</span>
                          <div className="flex items-center gap-2">
                            {hasVoted && <Check className="w-5 h-5 text-purple-400" />}
                            <span className="text-purple-300 font-bold">{option.percentage}%</span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${option.percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          />
                        </div>
                        
                        <div className="text-left mt-2 text-purple-200 text-sm">
                          {option.votes} vote{option.votes !== 1 ? 's' : ''}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {poll.total_votes > 0 && (
                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-purple-300 text-sm">
                      Leading: <span className="font-bold text-white">
                        {poll.options.reduce((prev, current) => 
                          prev.votes > current.votes ? prev : current
                        ).text}
                      </span>
                    </div>
                    
                    {isVotingEnded(poll.ends_at) && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold">Final Results</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MoviePolls;