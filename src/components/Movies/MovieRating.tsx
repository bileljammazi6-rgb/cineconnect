import React, { useState, useEffect } from 'react';
import { Star, Plus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface MovieRatingProps {
  movieId: string;
  movieTitle: string;
  moviePoster?: string;
}

interface Rating {
  id: string;
  rating: number;
  review: string;
  created_at: string;
}


export const MovieRating: React.FC<MovieRatingProps> = ({ movieId, movieTitle, moviePoster }) => {
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserRating();
      checkWatchlistStatus();
    }
  }, [user, movieId]);

  const fetchUserRating = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('movie_ratings')
      .select('*')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .single();

    if (data) {
      setUserRating(data);
      setRating(data.rating);
      setReview(data.review || '');
    }
  };

  const checkWatchlistStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('movie_watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .single();

    setIsInWatchlist(!!data);
  };

  const handleRatingSubmit = async () => {
    if (!user || rating === 0) return;

    setLoading(true);
    try {
      const ratingData = {
        user_id: user.id,
        movie_id: movieId,
        movie_title: movieTitle,
        rating,
        review: review.trim() || null
      };

      if (userRating) {
        await supabase
          .from('movie_ratings')
          .update(ratingData)
          .eq('id', userRating.id);
      } else {
        await supabase
          .from('movie_ratings')
          .insert(ratingData);
      }

      await fetchUserRating();
      setShowRatingForm(false);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (isInWatchlist) {
        await supabase
          .from('movie_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);
        setIsInWatchlist(false);
      } else {
        await supabase
          .from('movie_watchlist')
          .insert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster
          });
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < currentRating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive ? () => setRating(i + 1) : undefined}
      />
    ));
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Rate & Review</h3>
        <div className="flex gap-2">
          <button
            onClick={toggleWatchlist}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isInWatchlist
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
          </button>
        </div>
      </div>

      {userRating && !showRatingForm ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Your rating:</span>
            <div className="flex">{renderStars(userRating.rating)}</div>
          </div>
          {userRating.review && (
            <div>
              <span className="text-sm text-gray-600">Your review:</span>
              <p className="text-gray-800 mt-1">{userRating.review}</p>
            </div>
          )}
          <button
            onClick={() => setShowRatingForm(true)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Edit rating
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {!showRatingForm ? (
            <button
              onClick={() => setShowRatingForm(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Star className="w-4 h-4" />
              Rate this movie
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-1">{renderStars(rating, true)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review (optional)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRatingSubmit}
                  disabled={loading || rating === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : userRating ? 'Update' : 'Submit'}
                </button>
                <button
                  onClick={() => {
                    setShowRatingForm(false);
                    if (userRating) {
                      setRating(userRating.rating);
                      setReview(userRating.review || '');
                    } else {
                      setRating(0);
                      setReview('');
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
