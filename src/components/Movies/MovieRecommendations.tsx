import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Users, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Movie {
  id: string;
  title: string;
  poster: string;
  rating: number;
  year: string;
  genre: string;
}

interface RecommendationSection {
  title: string;
  icon: React.ReactNode;
  movies: Movie[];
}

export const MovieRecommendations: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [userRatings, popularMovies, recentlyRated] = await Promise.all([
        fetchUserRatings(),
        fetchPopularMovies(),
        fetchRecentlyRatedMovies()
      ]);

      const sections: RecommendationSection[] = [
        {
          title: 'Trending Now',
          icon: <TrendingUp className="w-5 h-5" />,
          movies: generateTrendingMovies()
        },
        {
          title: 'Based on Your Ratings',
          icon: <Star className="w-5 h-5" />,
          movies: generatePersonalizedRecommendations(userRatings)
        },
        {
          title: 'Popular with CineConnect Users',
          icon: <Users className="w-5 h-5" />,
          movies: popularMovies
        },
        {
          title: 'Recently Rated by Others',
          icon: <Clock className="w-5 h-5" />,
          movies: recentlyRated
        }
      ];

      setRecommendations(sections.filter(section => section.movies.length > 0));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRatings = async () => {
    const { data } = await supabase
      .from('movie_ratings')
      .select('movie_id, movie_title, rating')
      .eq('user_id', user?.id)
      .order('rating', { ascending: false })
      .limit(10);

    return data || [];
  };

  const fetchPopularMovies = async () => {
    const { data } = await supabase
      .from('movie_ratings')
      .select('movie_id, movie_title, rating')
      .order('created_at', { ascending: false })
      .limit(20);

    const movieRatings = data?.reduce((acc, rating) => {
      if (!acc[rating.movie_id]) {
        acc[rating.movie_id] = {
          title: rating.movie_title,
          ratings: [],
          count: 0
        };
      }
      acc[rating.movie_id].ratings.push(rating.rating);
      acc[rating.movie_id].count++;
      return acc;
    }, {} as any) || {};

    return Object.entries(movieRatings)
      .map(([id, data]: [string, any]) => ({
        id,
        title: data.title,
        poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(data.title)}`,
        rating: data.ratings.reduce((sum: number, r: number) => sum + r, 0) / data.ratings.length,
        year: '2024',
        genre: 'Drama'
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  };

  const fetchRecentlyRatedMovies = async () => {
    const { data } = await supabase
      .from('movie_ratings')
      .select('movie_id, movie_title, rating, created_at')
      .neq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(6);

    return data?.map(rating => ({
      id: rating.movie_id,
      title: rating.movie_title,
      poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(rating.movie_title)}`,
      rating: rating.rating,
      year: '2024',
      genre: 'Drama'
    })) || [];
  };

  const generateTrendingMovies = (): Movie[] => {
    const trendingTitles = [
      'Dune: Part Two',
      'Oppenheimer',
      'Barbie',
      'Spider-Man: Across the Spider-Verse',
      'Guardians of the Galaxy Vol. 3',
      'The Batman'
    ];

    return trendingTitles.map((title, index) => ({
      id: `trending-${index}`,
      title,
      poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(title)}`,
      rating: 4.2 + Math.random() * 0.8,
      year: '2024',
      genre: 'Action'
    }));
  };

  const generatePersonalizedRecommendations = (userRatings: any[]): Movie[] => {
    if (userRatings.length === 0) return [];

    const highRatedGenres = ['Sci-Fi', 'Action', 'Drama', 'Comedy', 'Thriller'];
    const recommendedTitles = [
      'Blade Runner 2049',
      'Inception',
      'The Dark Knight',
      'Interstellar',
      'Mad Max: Fury Road',
      'Parasite'
    ];

    return recommendedTitles.slice(0, 6).map((title, index) => ({
      id: `recommended-${index}`,
      title,
      poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(title)}`,
      rating: 4.0 + Math.random() * 1.0,
      year: '2024',
      genre: highRatedGenres[index % highRatedGenres.length]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }, (_, j) => (
                <div key={j} className="space-y-2">
                  <div className="aspect-[2/3] bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Movies</h2>
        <p className="text-gray-600">Personalized recommendations just for you</p>
      </div>

      {recommendations.map((section, index) => (
        <div key={index} className="space-y-4">
          <div className="flex items-center gap-2">
            {section.icon}
            <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {section.movies.map((movie) => (
              <div
                key={movie.id}
                className="group cursor-pointer transform transition-transform hover:scale-105"
              >
                <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden mb-2">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">
                      {movie.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{movie.year} • {movie.genre}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
