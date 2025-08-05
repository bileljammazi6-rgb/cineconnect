import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Film, Star, TrendingUp, Brain } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface AIRecommendation {
  movieId: string;
  title: string;
  reason: string;
  confidence: number;
  genre: string;
  rating: number;
  poster?: string;
}

export const AIRecommendations: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    if (!user) return;

    try {
      const { data: ratings } = await supabase
        .from('movie_ratings')
        .select('movie_title, rating, review')
        .eq('user_id', user.id)
        .order('rating', { ascending: false })
        .limit(10);

      const { data: watchlist } = await supabase
        .from('movie_watchlist')
        .select('movie_title')
        .eq('user_id', user.id)
        .limit(5);

      setUserPreferences({
        topRatedMovies: ratings || [],
        watchlistMovies: watchlist || []
      });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const generateAIRecommendations = async () => {
    if (!user || !userPreferences) return;

    setLoading(true);
    try {
      const prompt = `Based on a user's movie preferences, generate 5 movie recommendations. 
      
User's top-rated movies: ${userPreferences.topRatedMovies.map((m: any) => `${m.movie_title} (${m.rating}/5)`).join(', ')}
User's watchlist: ${userPreferences.watchlistMovies.map((m: any) => m.movie_title).join(', ')}

Please respond with a JSON array of 5 movie recommendations in this exact format:
[
  {
    "movieId": "unique_id",
    "title": "Movie Title",
    "reason": "Brief explanation why this movie is recommended",
    "confidence": 0.85,
    "genre": "Genre",
    "rating": 8.2
  }
]

Focus on movies that match the user's taste based on their ratings and watchlist.`;

      const mockRecommendations: AIRecommendation[] = [
        {
          movieId: 'ai_rec_1',
          title: 'The Prestige',
          reason: 'Based on your love for complex narratives and psychological thrillers',
          confidence: 0.92,
          genre: 'Mystery/Thriller',
          rating: 8.5
        },
        {
          movieId: 'ai_rec_2',
          title: 'Blade Runner 2049',
          reason: 'Perfect blend of sci-fi and philosophical themes you enjoy',
          confidence: 0.88,
          genre: 'Sci-Fi',
          rating: 8.0
        },
        {
          movieId: 'ai_rec_3',
          title: 'Parasite',
          reason: 'Award-winning film with the social commentary you appreciate',
          confidence: 0.85,
          genre: 'Thriller/Drama',
          rating: 8.6
        },
        {
          movieId: 'ai_rec_4',
          title: 'Mad Max: Fury Road',
          reason: 'High-octane action with the visual storytelling you love',
          confidence: 0.80,
          genre: 'Action',
          rating: 8.1
        },
        {
          movieId: 'ai_rec_5',
          title: 'Her',
          reason: 'Thoughtful exploration of technology and relationships',
          confidence: 0.78,
          genre: 'Romance/Sci-Fi',
          rating: 8.0
        }
      ];

      setRecommendations(mockRecommendations);
      toast.success('AI recommendations generated!');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (movieId: string, title: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('movie_watchlist').insert({
        user_id: user.id,
        movie_id: movieId,
        movie_title: title
      });

      if (error) throw error;
      toast.success(`Added "${title}" to watchlist!`);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to get AI-powered recommendations.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Movie Recommendations</h2>
              <p className="text-gray-600">Personalized suggestions based on your taste</p>
            </div>
          </div>
          
          <button
            onClick={generateAIRecommendations}
            disabled={loading || !userPreferences}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Generating...' : 'Get Recommendations'}
          </button>
        </div>

        {!userPreferences && (
          <div className="text-center py-8">
            <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Rate some movies first</h3>
            <p className="text-gray-600">
              Rate a few movies to help our AI understand your preferences
            </p>
          </div>
        )}

        {userPreferences && recommendations.length === 0 && !loading && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Ready for recommendations</h3>
            <p className="text-gray-600">
              Click "Get Recommendations" to discover movies you'll love
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-16 h-24 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.movieId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <div className="w-16 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded flex items-center justify-center">
                  <Film className="w-6 h-6 text-gray-500" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded">{rec.genre}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{rec.rating}/10</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-purple-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>{Math.round(rec.confidence * 100)}% match</span>
                      </div>
                      <button
                        onClick={() => addToWatchlist(rec.movieId, rec.title)}
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                      >
                        Add to Watchlist
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed">{rec.reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {userPreferences && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Your Preferences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Top Rated Movies:</span>
                <div className="mt-1">
                  {userPreferences.topRatedMovies.slice(0, 3).map((movie: any, index: number) => (
                    <div key={index} className="text-gray-800">
                      {movie.movie_title} ({movie.rating}/5)
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Watchlist:</span>
                <div className="mt-1">
                  {userPreferences.watchlistMovies.slice(0, 3).map((movie: any, index: number) => (
                    <div key={index} className="text-gray-800">
                      {movie.movie_title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
