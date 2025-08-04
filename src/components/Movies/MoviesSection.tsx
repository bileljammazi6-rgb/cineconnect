import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Film, Star, ExternalLink, Play, Users, Calendar } from 'lucide-react';
import { MovieInvitation } from './MovieInvitation';
import toast from 'react-hot-toast';

// Configuration
const CONFIG = {
  TMDB_API_KEY: "0a7ef230ab60a26cca44c7d8a6d24c25",
  TMDB_BASE_URL: "https://api.themoviedb.org/3",
  TMDB_IMAGE_BASE_URL: "https://image.tmdb.org/t/p/"
};

// Movie Data
const movieData = [
  { title: "11.22.63", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/tZ6SW8kJ" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/h85VouaM" }, { text: "Ep 3", url: "https://pixeldrain.com/api/file/HRVvHhzJ" }, { text: "Ep 4", url: "https://pixeldrain.com/api/file/a5wdzGgW" }, { text: "Ep 5", url: "https://pixeldrain.com/api/file/REnmBucQ" }, { text: "Ep 6", url: "https://pixeldrain.com/api/file/YvgfB1fh" }, { text: "Ep 7", url: "https://pixeldrain.com/api/file/kvMpjWwG" }, { text: "Ep 8", url: "https://pixeldrain.com/api/file/wzfmg5nr" }] },
  { title: "The Queen's Gambit", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/S4tsGHoa" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/PP54HWnP" }] },
  { title: "Anne with an E", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/ftwuBgUq" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/kZS9K28Q" }] },
  { title: "Squid Game", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/hXikoTYD" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/J6h6KZBZ" }] },
  { title: "Suits", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/ou4c9ZQh" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/gWCnTbVP" }, { text: "Ep 3", url: "https://pixeldrain.com/api/file/Z18kGAZb" }] },
  { title: "Mobland", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/c1yALumo" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/5vByKXNB" }, { text: "Ep 3", url: "https://pixeldrain.com/api/file/qwZSeP5c" }, { text: "Ep 4", url: "https://download2391.mediafire.com/0pbepovjs6rgoyHScbCb4-9b4eWUl7QqUcnBgEL3H_qp73xecB1C8a-HiqNbWptiAq1LjgoLT9jUR9UHgFYYqgIXjhs9u5y7haOzf0ivNV0wW7ohoe7t9EcDeQEYx0ytOh1aHBrgeBXMYYHf0d-Ju8nmVic-pktMcmctx1bLETsi7g/sttacs7uqrsf9dt/Mobland+S01+004+720p.mp4" }, { text: "Ep 5", url: "https://pixeldrain.com/api/file/9F3gFRvF" }, { text: "Ep 6", url: "https://pixeldrain.com/api/file/2untTLEh" }, { text: "Ep 7", url: "https://pixeldrain.com/api/file/4JuMeWG8" }, { text: "Ep 8", url: "https://pixeldrain.com/api/file/ykgLmxs9" }, { text: "Ep 9", url: "https://pixeldrain.com/api/file/FKPTCSaQ" }, { text: "Ep 10", url: "https://pixeldrain.com/api/file/aAcYYP26" }] },
  { title: "The Wheel of Time", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/EXUFcGaZ" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/eide7Tyv" }, { text: "Ep 3", url: "https://pixeldrain.com/api/file/z2iXUxFL" }] },
  { title: "Jujutsu Kaisen", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/wyupdiNU" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/U66Gg9hN" }, { text: "Ep 3", url: "https://pixeldrain.com/api/file/u8j2o5e4" }] },
  { title: "Solo Leveling", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/XB2iHAFa" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/3X86siRC" }, { text: "Ep 3", url: "https://pixeldrain.com/api/file/3X86siRC" }] },
  { title: "6 Underground", links: [{ text: "Watch", url: "https://pixeldrain.com/api/file/CyHTga5w" }] },
  { title: "Free Guy", links: [{ text: "Watch", url: "https://pixeldrain.com/api/file/QUCXwxeF" }] },
  { title: "Ready Player One", links: [{ text: "Watch", url: "https://pixeldrain.com/api/file/Uz1wpSJ6" }] },
  { title: "Forgotten", links: [{ text: "Watch", url: "https://pixeldrain.com/api/file/iKhxqxFD" }] },
  { title: "The Invisible Guest", links: [{ text: "Watch", url: "https://pixeldrain.com/api/file/s9VpAs9Z" }] },
  { title: "All of Us Are Dead", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/WG3NJoAK" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/xv1y74MP" }, { text: "Ep 3", url: "https://pixeldrain.com/api/file/TKkpUnwJ" }, { text: "Ep 4", url: "https://pixeldrain.com/api/file/2GDstPyV" }, { text: "Ep 5", url: "https://pixeldrain.com/api/file/EokWU4JK" }] },
  { title: "Attack on Titan", links: [{ text: "Ep 1", url: "https://pixeldrain.com/api/file/jiAm7kxg" }, { text: "Ep 2", url: "https://pixeldrain.com/api/file/SBVUfsvw" }, { text: "Ep 3", url: "https://pixeldrain.com/api/file/RnKc3j6j" }, { text: "Ep 4", url: "https://pixeldrain.com/api/file/TgA7Nf9p" }, { text: "Ep 5", url: "https://pixeldrain.com/api/file/5YNAWddf" }, { text: "Ep 6", url: "https://pixeldrain.com/api/file/4H5xGTt5" }] },
  { title: "Interstellar", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/AeJScF7G" }] },
  { title: "17 Again", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/DNGsiNcv" }] },
  { title: "Mission Impossible: Final Reckoning", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/ByucVF3t" }] },
  { title: "Stranger When We Meet", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/r4cB6Aj5" }] },
  { title: "Vini Jr", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/kBkZSXe4" }] },
  { title: "Sonic 3", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/GyzsmZsU" }] },
  { title: "Death of the Unicorn", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/UtcYURtk" }] },
  { title: "Memento", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/vZeEZ7WM" }] },
  { title: "Mirage", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/x5LY56c9" }] },
  { title: "Garfield : مدبلج", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/ZbnWak2C" }] },
  { title: "Elemental", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/X1cAtnCo" }] },
  { title: "Moana: مدبلج", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/tg6RPcZj" }] },
  { title: "Moana 2 : مدبلج", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/PvcFhorc" }] },
  { title: "Big Hero 6", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/Z3usXvQR" }] },
  { title: "Frozen", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/nhGyUEWE" }] },
  { title: "The Match", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/cCbj6zmF" }] },
  { title: "Shutter Island", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/mohEYXXw" }] },
  { title: "The Conjuring", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/A2F5GF4n" }] },
  { title: "Gone Girl", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/SEUBGe5E" }] },
  { title: "The Shawshank Redemption", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/1BDdAyo9" }] },
  { title: "Deadpool", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/7q5fNMVX" }] },
  { title: "Hereditary", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/TcoXyNTd" }] },
  { title: "Blade Runner 2049", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/3WE1FrNn" }] },
  { title: "Se7en", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/5WCTREq7" }] },
  { title: "Oldboy", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/mJHcZype" }] },
  { title: "A Quiet Place", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/ZFHXra4f" }] },
  { title: "Parasite", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/z3x7ufGR" }] },
  { title: "The Matrix", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/wh3iPhbw" }] },
  { title: "Get Out", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/tRMxPrEh" }] },
  { title: "Fight Club", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/1GSreeCN" }] },
  { title: "Zombieland", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/31erh9yM" }] },
  { title: "The Dark Knight", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/2XxUnAiL" }] },
  { title: "Pulp Fiction", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/xhmTwHc5" }] },
  { title: "Arrival", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/GSiZcGxu" }] },
  { title: "The Exorcist", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/Vqu2u1jZ" }] },
  { title: "La La Land", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/9eMsbMaT" }] },
  { title: "The Big Lebowski", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/sk84MG4s" }] },
  { title: "Prisoners", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/r4e4kqXZ" }] },
  { title: "Mad Max: Fury Road", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/enEkogsJ" }] },
  { title: "Whiplash", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/bduADEUE" }] },
  { title: "Django Unchained", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/bduADEU" }] },
  { title: "Her", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/mBpGfW5k" }] },
  { title: "The Sixth Sense", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/N7BqqAcR" }] },
  { title: "Guardians of the Galaxy", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/Ay2n7tbE" }] },
  { title: "It", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/pvMFBERU" }] },
  { title: "Knives Out", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/vbz3UouH" }] },
  { title: "The Wolf of Wall Street", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/NRYezmAR" }] },
  { title: "Ex Machina", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/MsnSAGph" }] },
  { title: "Amelie", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/okivRoKv" }] },
  { title: "Drive", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/Ynk1UBSZ" }] },
  { title: "Spirited Away", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/SwBc7Xmn" }] },
  { title: "The Departed", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/k2Jwycuc" }] },
  { title: "Train to Busan", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/HFzG4HAp" }] },
  { title: "Edge of Tomorrow", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/5jeA4biy" }] },
  { title: "Black Swan", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/RqNxZDhr" }] },
  { title: "Good Will Hunting", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/yeHG7CJY" }] },
  { title: "Sicario", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/iJ5Rrvab" }] },
  { title: "The Truman Show", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/Zs1t2nZe" }] },
  { title: "Annihilation", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/9ihL6zh5" }] },
  { title: "There Will Be Blood", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/3yp82uMk" }] },
  { title: "Inglourious Basterds", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/QDFGSrwX" }] },
  { title: "The Social Network", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/33VZYPQV" }] },
  { title: "The Fast and the Furious", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/Fg2hjBDz" }] },
  { title: "2 Fast 2 Furious", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/hjjiiJNu" }] },
  { title: "The Fast and the Furious: Tokyo Drift", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/Sbf3majB" }] },
  { title: "Fast & Furious", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/FnBffMgK" }] },
  { title: "Fast & Furious 6", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/NYExaXxu" }] },
  { title: "Furious 7", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/ffbrzfyK" }] },
  { title: "The Fate of the Furious", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/KkemW2Ez" }] },
  { title: "Fast & Furious Presents: Hobbs & Shaw", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/kCBtproH" }] },
  { title: "F9: The Fast Saga", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/m2EdMHuv" }] },
  { title: "Your Name", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/i6QpqBUi" }] },
  { title: "A Silent Voice", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/SqALgvZU" }] },
  { title: "Real Steel", links: [{ text: "🔗", url: "https://pixeldrain.com/api/file/EqUVUAoi" }] }
];

const comingSoonMovies = ["Need for speed", "Silo", "Demon Slayer", "Kaiju No. 8", "Mashle: Magic and Muscles"];

// TMDB API Service
const tmdbService = {
  cache: new Map(),
  
  async fetchWithCache(url: string, cacheKey: string) {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('TMDB API Error:', error);
      throw error;
    }
  },
  
  async searchMulti(query: string) {
    const url = `${CONFIG.TMDB_BASE_URL}/search/multi?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    return this.fetchWithCache(url, `search_${query}`);
  },
  
  getImageUrl(path: string, size = 'w500') {
    return `${CONFIG.TMDB_IMAGE_BASE_URL}${size}${path}`;
  }
};

interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  watch_links?: Array<{ text: string; url: string }>;
}

export function MoviesSection() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvitation, setShowInvitation] = useState<{movie: string, url: string} | null>(null);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    try {
      const moviePromises = movieData.map(movie => 
        tmdbService.searchMulti(movie.title).catch(error => {
          console.error(`Error loading ${movie.title}:`, error);
          return null;
        })
      );
      
      const comingSoonPromises = comingSoonMovies.map(movie => 
        tmdbService.searchMulti(movie).catch(error => {
          console.error(`Error loading ${movie}:`, error);
          return null;
        })
      );
      
      const [movieResults, comingSoonResults] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(comingSoonPromises)
      ]);
      
      const processedMovies = movieResults
        .filter(result => result && result.results && result.results.length > 0)
        .map(result => result.results[0]);
      
      const processedComingSoon = comingSoonResults
        .filter(result => result && result.results && result.results.length > 0)
        .map(result => result.results[0]);
      
      setMovies(processedMovies);
      setComingSoon(processedComingSoon);
      toast.success('Movies loaded successfully!');
    } catch (error) {
      console.error('Error loading movies:', error);
      toast.error('Error loading movies');
    } finally {
      setLoading(false);
    }
  };

  const getMovieLinks = (title: string) => {
    const movie = movieData.find(m => m.title === title);
    return movie ? movie.links : [];
  };

  const filteredMovies = useMemo(() => {
    if (!searchTerm) return movies;
    return movies.filter(movie => 
      (movie.title || movie.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [movies, searchTerm]);

  const openMovieModal = (movie: Movie) => {
    const movieWithLinks = {
      ...movie,
      watch_links: getMovieLinks(movie.title || movie.name || '')
    };
    setSelectedMovie(movieWithLinks);
  };

  const openInvitation = (movie: Movie) => {
    const movieLinks = getMovieLinks(movie.title || movie.name || '');
    if (movieLinks.length > 0) {
      setShowInvitation({
        movie: movie.title || movie.name || '',
        url: movieLinks[0].url
      });
    } else {
      toast.error('No watch links available for this movie');
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-full">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-800 animate-pulse aspect-[2/3] rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6 text-center">
            🎬 Cinema Paradise
          </h2>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search movies and shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Available Movies */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-white mb-6 flex items-center">
            <Play className="w-8 h-8 mr-3 text-green-400" />
            Available Now ({filteredMovies.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <AnimatePresence>
              {filteredMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => openMovieModal(movie)}
                >
                  <div className="relative overflow-hidden rounded-xl bg-gray-800 shadow-2xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-purple-500/25">
                    <div className="aspect-[2/3] relative">
                      {movie.poster_path ? (
                        <img
                          src={tmdbService.getImageUrl(movie.poster_path)}
                          alt={`${movie.title || movie.name} Poster`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <Film className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between text-white">
                            <Play className="w-8 h-8" />
                            {movie.vote_average && (
                              <div className="flex items-center bg-yellow-500 px-2 py-1 rounded-full">
                                <Star className="w-3 h-3 mr-1" />
                                <span className="text-xs font-bold text-black">
                                  {movie.vote_average.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        Available
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                        {movie.title || movie.name}
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        {movie.release_date || movie.first_air_date ? 
                          new Date(movie.release_date || movie.first_air_date || '').getFullYear() : 
                          'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Coming Soon */}
        <div>
          <h3 className="text-3xl font-bold text-white mb-6 flex items-center">
            <Film className="w-8 h-8 mr-3 text-orange-400" />
            Coming Soon
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {comingSoon.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group cursor-pointer opacity-75 hover:opacity-100"
                onClick={() => openMovieModal(movie)}
              >
                <div className="relative overflow-hidden rounded-xl bg-gray-800 shadow-2xl transform transition-all duration-300 group-hover:scale-105">
                  <div className="aspect-[2/3] relative">
                    {movie.poster_path ? (
                      <img
                        src={tmdbService.getImageUrl(movie.poster_path)}
                        alt={`${movie.title || movie.name} Poster`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Film className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      Coming Soon
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
                      {movie.title || movie.name}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">
                      {movie.release_date || movie.first_air_date ? 
                        new Date(movie.release_date || movie.first_air_date || '').getFullYear() : 
                        'TBA'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Movie Modal */}
        <AnimatePresence>
          {selectedMovie && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedMovie(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  {selectedMovie.backdrop_path && (
                    <div className="h-64 md:h-80 relative overflow-hidden rounded-t-2xl">
                      <img
                        src={tmdbService.getImageUrl(selectedMovie.backdrop_path, 'w1280')}
                        alt="Backdrop"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                    </div>
                  )}
                  
                  <button
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors"
                    onClick={() => setSelectedMovie(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 flex-shrink-0">
                      {selectedMovie.poster_path ? (
                        <img
                          src={tmdbService.getImageUrl(selectedMovie.poster_path)}
                          alt="Movie Poster"
                          className="w-full h-auto rounded-lg shadow-lg"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-700 rounded-lg flex items-center justify-center">
                          <Film className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="md:w-2/3">
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        {selectedMovie.title || selectedMovie.name}
                      </h2>
                      
                      {selectedMovie.overview && (
                        <p className="text-gray-300 leading-relaxed mb-6">
                          {selectedMovie.overview}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        {(selectedMovie.release_date || selectedMovie.first_air_date) && (
                          <div>
                            <span className="text-gray-400">Release Date:</span>
                            <span className="ml-2 text-white font-medium">
                              {selectedMovie.release_date || selectedMovie.first_air_date}
                            </span>
                          </div>
                        )}
                        {selectedMovie.vote_average && (
                          <div>
                            <span className="text-gray-400">Rating:</span>
                            <span className="ml-2 text-yellow-400 font-medium flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              {selectedMovie.vote_average.toFixed(1)}/10
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {selectedMovie.watch_links && selectedMovie.watch_links.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
                            <Play className="w-5 h-5 mr-2" />
                            Watch Now
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedMovie.watch_links.map((link, index) => (
                              <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-center transition-all duration-300 flex items-center justify-center font-medium shadow-lg hover:shadow-green-500/25"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {link.text || 'Watch'}
                              </a>
                            ))}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <button
                              onClick={() => openInvitation(selectedMovie)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                            >
                              <Users className="w-4 h-4" />
                              Invite Friends to Watch
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Movie Invitation Modal */}
        <AnimatePresence>
          {showInvitation && (
            <MovieInvitation
              movieTitle={showInvitation.movie}
              movieUrl={showInvitation.url}
              onClose={() => setShowInvitation(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}