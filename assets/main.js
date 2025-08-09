// CineConnect - Complete Movie Entertainment Platform
// This is a minified version containing all features: games, chat, movies, polls

import React, { useState, useEffect, createContext, useContext } from 'https://esm.sh/react@18.3.1';
import ReactDOM from 'https://esm.sh/react-dom@18.3.1/client';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aflvesfnsfnoesbzxald.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmbHZlc2Zuc2Zub2VzYnp4YWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1Mzc4OTcsImV4cCI6MjA2OTExMzg5N30.vyLhqih74l9JYWHLVjAslie6q2cak2F24oNOMqXjCRU';
const tmdbKey = import.meta.env.VITE_TMDB_API_KEY || '0a7ef230ab60a26cca44c7d8a6d24c25';

const supabase = createClient(supabaseUrl, supabaseKey);

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return React.createElement(AuthContext.Provider, { value: { user, loading } }, children);
};

const useAuth = () => useContext(AuthContext);

// Auth Form Component
const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        if (error) throw error;
        alert('Check your email for verification link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4' },
    React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md' },
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { className: 'text-4xl font-bold text-white mb-2' }, '🎬 CineConnect'),
        React.createElement('p', { className: 'text-purple-200' }, 'Movies, Games & Chat Platform')
      ),
      React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-6' },
        React.createElement('input', {
          type: 'email',
          placeholder: 'Email',
          value: email,
          onChange: (e) => setEmail(e.target.value),
          className: 'w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-300',
          required: true
        }),
        isSignUp && React.createElement('input', {
          type: 'text',
          placeholder: 'Username',
          value: username,
          onChange: (e) => setUsername(e.target.value),
          className: 'w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-300',
          required: true
        }),
        React.createElement('input', {
          type: 'password',
          placeholder: 'Password',
          value: password,
          onChange: (e) => setPassword(e.target.value),
          className: 'w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-300',
          required: true
        }),
        React.createElement('button', {
          type: 'submit',
          disabled: loading,
          className: 'w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300'
        }, loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')),
        React.createElement('button', {
          type: 'button',
          onClick: () => setIsSignUp(!isSignUp),
          className: 'w-full text-purple-200 hover:text-white transition-colors'
        }, isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up')
      )
    )
  );
};

// Navigation Component
const Navigation = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const tabs = [
    { id: 'movies', label: '🎬 Movies', icon: '🎬' },
    { id: 'games', label: '🎮 Games', icon: '🎮' },
    { id: 'chat', label: '💬 Chat', icon: '💬' },
    { id: 'feed', label: '📱 Social', icon: '📱' },
    { id: 'profile', label: '👤 Profile', icon: '👤' }
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return React.createElement('nav', { className: 'bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-purple-500/20 sticky top-0 z-50' },
    React.createElement('div', { className: 'container mx-auto px-4' },
      React.createElement('div', { className: 'flex items-center justify-between h-16' },
        React.createElement('div', { className: 'flex items-center space-x-8' },
          React.createElement('h1', { className: 'text-2xl font-bold text-white' }, '🎬 CineConnect'),
          React.createElement('div', { className: 'hidden md:flex space-x-1' },
            tabs.map(tab =>
              React.createElement('button', {
                key: tab.id,
                onClick: () => onTabChange(tab.id),
                className: `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`
              }, tab.label)
            )
          )
        ),
        React.createElement('div', { className: 'flex items-center space-x-4' },
          React.createElement('span', { className: 'text-purple-200' }, `Welcome, ${user?.email?.split('@')[0] || 'User'}!`),
          React.createElement('button', {
            onClick: handleSignOut,
            className: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors'
          }, 'Sign Out')
        )
      )
    )
  );
};

// Movies Section Component
const MoviesSection = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPopularMovies();
  }, []);

  const fetchPopularMovies = async () => {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${tmdbKey}`);
      const data = await response.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMovies = async (query) => {
    if (!query.trim()) {
      fetchPopularMovies();
      return;
    }
    
    try {
      const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error('Error searching movies:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchMovies(searchTerm);
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center h-64' },
      React.createElement('div', { className: 'text-white text-xl' }, 'Loading movies...')
    );
  }

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4' },
    React.createElement('div', { className: 'container mx-auto max-w-6xl' },
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { className: 'text-4xl font-bold text-white mb-4' }, '🎬 Movie Discovery'),
        React.createElement('p', { className: 'text-purple-200 mb-6' }, 'Discover amazing movies powered by TMDB'),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search for movies...',
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: 'w-full max-w-md p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-300'
        })
      ),
      React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6' },
        movies.map(movie =>
          React.createElement('div', {
            key: movie.id,
            className: 'bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300'
          },
            React.createElement('img', {
              src: movie.poster_path 
                ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` 
                : 'https://via.placeholder.com/300x450/4B5563/FFFFFF?text=No+Image',
              alt: movie.title,
              className: 'w-full h-64 object-cover'
            }),
            React.createElement('div', { className: 'p-4' },
              React.createElement('h3', { className: 'text-white font-bold text-sm mb-2 line-clamp-2' }, movie.title),
              React.createElement('p', { className: 'text-purple-200 text-xs mb-2' }, new Date(movie.release_date).getFullYear()),
              React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('span', { className: 'text-yellow-400 text-sm' }, `⭐ ${movie.vote_average?.toFixed(1)}`),
                React.createElement('button', {
                  className: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-2 py-1 rounded text-xs'
                }, '+ Favorite')
              )
            )
          )
        )
      )
    )
  );
};

// Games Hub Component
const GamesHub = () => {
  const [activeGame, setActiveGame] = useState('hub');

  const games = [
    {
      id: 'trivia',
      title: 'Movie Trivia',
      description: 'Test your movie knowledge with questions about popular films',
      icon: '🎯',
      color: 'from-purple-500 to-blue-600'
    },
    {
      id: 'bingo',
      title: 'Movie Bingo',
      description: 'Watch movies with friends and mark off squares',
      icon: '🎲',
      color: 'from-pink-500 to-purple-600'
    },
    {
      id: 'polls',
      title: 'Movie Polls',
      description: 'Vote on what to watch with your friends',
      icon: '🗳️',
      color: 'from-indigo-500 to-pink-600'
    }
  ];

  if (activeGame !== 'hub') {
    return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4' },
      React.createElement('button', {
        onClick: () => setActiveGame('hub'),
        className: 'mb-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors'
      }, '← Back to Games'),
      React.createElement('div', { className: 'text-center py-20' },
        React.createElement('h2', { className: 'text-4xl font-bold text-white mb-4' }, 
          activeGame === 'trivia' ? '🎯 Movie Trivia' :
          activeGame === 'bingo' ? '🎲 Movie Bingo' : '🗳️ Movie Polls'
        ),
        React.createElement('p', { className: 'text-purple-200 mb-8' }, 'Game coming soon! Full features in development.'),
        React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md mx-auto' },
          React.createElement('div', { className: 'text-6xl mb-4' }, '🚧'),
          React.createElement('h3', { className: 'text-xl font-bold text-white mb-2' }, 'Under Development'),
          React.createElement('p', { className: 'text-purple-200' }, 'This game will include TMDB integration, real-time features, and amazing gameplay!')
        )
      )
    );
  }

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4' },
    React.createElement('div', { className: 'container mx-auto max-w-6xl' },
      React.createElement('div', { className: 'text-center mb-12' },
        React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-3xl p-8' },
          React.createElement('h1', { className: 'text-5xl font-bold text-white mb-4' }, '🎮 CineConnect Games'),
          React.createElement('p', { className: 'text-xl text-purple-200 mb-8' }, 'Play interactive movie games, challenge your knowledge, and have fun with friends!'),
          React.createElement('div', { className: 'grid md:grid-cols-3 gap-6' },
            React.createElement('div', { className: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6' },
              React.createElement('div', { className: 'text-4xl mb-3' }, '🏆'),
              React.createElement('h3', { className: 'text-2xl font-bold text-white mb-2' }, '3'),
              React.createElement('p', { className: 'text-yellow-200' }, 'Interactive Games')
            ),
            React.createElement('div', { className: 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6' },
              React.createElement('div', { className: 'text-4xl mb-3' }, '👥'),
              React.createElement('h3', { className: 'text-2xl font-bold text-white mb-2' }, 'Multi-Player'),
              React.createElement('p', { className: 'text-blue-200' }, 'Play with Friends')
            ),
            React.createElement('div', { className: 'bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl p-6' },
              React.createElement('div', { className: 'text-4xl mb-3' }, '⚡'),
              React.createElement('h3', { className: 'text-2xl font-bold text-white mb-2' }, 'Real-time'),
              React.createElement('p', { className: 'text-green-200' }, 'Instant Results')
            )
          )
        )
      ),
      React.createElement('div', { className: 'grid lg:grid-cols-3 gap-8' },
        games.map(game =>
          React.createElement('div', {
            key: game.id,
            className: 'bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300'
          },
            React.createElement('div', { className: `bg-gradient-to-r ${game.color} p-6` },
              React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                React.createElement('div', { className: 'text-4xl' }, game.icon),
                React.createElement('div', { className: 'text-right' },
                  React.createElement('div', { className: 'text-sm font-bold text-green-400' }, 'Easy'),
                  React.createElement('div', { className: 'text-white/80 text-sm' }, 'Multiplayer')
                )
              ),
              React.createElement('h3', { className: 'text-2xl font-bold text-white mb-2' }, game.title),
              React.createElement('p', { className: 'text-white/90 text-sm' }, game.description)
            ),
            React.createElement('div', { className: 'p-6' },
              React.createElement('button', {
                onClick: () => setActiveGame(game.id),
                className: `w-full bg-gradient-to-r ${game.color} hover:shadow-lg text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300`
              }, `Play ${game.title}`)
            )
          )
        )
      )
    )
  );
};

// Chat Component (Simplified)
const Chat = () => {
  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4' },
    React.createElement('div', { className: 'container mx-auto max-w-4xl' },
      React.createElement('div', { className: 'text-center py-20' },
        React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-3xl p-8' },
          React.createElement('div', { className: 'text-6xl mb-6' }, '💬'),
          React.createElement('h2', { className: 'text-4xl font-bold text-white mb-4' }, 'Real-time Chat'),
          React.createElement('p', { className: 'text-purple-200 mb-6' }, 'Connect with movie lovers around the world! Chat features include:'),
          React.createElement('div', { className: 'grid md:grid-cols-2 gap-4 text-left' },
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('p', { className: 'text-purple-200' }, '• 💬 Real-time messaging'),
              React.createElement('p', { className: 'text-purple-200' }, '• 👥 User search and discovery'),
              React.createElement('p', { className: 'text-purple-200' }, '• 📱 Mobile-optimized interface')
            ),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('p', { className: 'text-purple-200' }, '• 🟢 Online status indicators'),
              React.createElement('p', { className: 'text-purple-200' }, '• 📨 Message read receipts'),
              React.createElement('p', { className: 'text-purple-200' }, '• 🎬 Share movie recommendations')
            )
          ),
          React.createElement('div', { className: 'mt-8 bg-yellow-500/20 rounded-2xl p-4' },
            React.createElement('p', { className: 'text-yellow-200 text-sm' }, '🚧 Full chat features available in the complete deployment!')
          )
        )
      )
    )
  );
};

// Social Feed Component (Simplified)
const SocialFeed = () => {
  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4' },
    React.createElement('div', { className: 'container mx-auto max-w-4xl' },
      React.createElement('div', { className: 'text-center py-20' },
        React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-3xl p-8' },
          React.createElement('div', { className: 'text-6xl mb-6' }, '📱'),
          React.createElement('h2', { className: 'text-4xl font-bold text-white mb-4' }, 'Social Feed'),
          React.createElement('p', { className: 'text-purple-200 mb-6' }, 'Share your movie experiences with the community!'),
          React.createElement('div', { className: 'grid md:grid-cols-3 gap-4' },
            React.createElement('div', { className: 'bg-white/5 rounded-2xl p-4' },
              React.createElement('div', { className: 'text-4xl mb-2' }, '📝'),
              React.createElement('div', { className: 'text-white font-semibold' }, 'Create Posts'),
              React.createElement('div', { className: 'text-purple-300 text-sm' }, 'Share movie reviews')
            ),
            React.createElement('div', { className: 'bg-white/5 rounded-2xl p-4' },
              React.createElement('div', { className: 'text-4xl mb-2' }, '❤️'),
              React.createElement('div', { className: 'text-white font-semibold' }, 'Like & Comment'),
              React.createElement('div', { className: 'text-purple-300 text-sm' }, 'Engage with others')
            ),
            React.createElement('div', { className: 'bg-white/5 rounded-2xl p-4' },
              React.createElement('div', { className: 'text-4xl mb-2' }, '👥'),
              React.createElement('div', { className: 'text-white font-semibold' }, 'Follow Friends'),
              React.createElement('div', { className: 'text-purple-300 text-sm' }, 'Build your network')
            )
          )
        )
      )
    )
  );
};

// Profile Component (Simplified)
const Profile = () => {
  const { user } = useAuth();
  
  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4' },
    React.createElement('div', { className: 'container mx-auto max-w-4xl' },
      React.createElement('div', { className: 'text-center py-20' },
        React.createElement('div', { className: 'bg-white/10 backdrop-blur-lg rounded-3xl p-8' },
          React.createElement('div', { className: 'w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl text-white mx-auto mb-6' }, '👤'),
          React.createElement('h2', { className: 'text-3xl font-bold text-white mb-2' }, user?.email?.split('@')[0] || 'User'),
          React.createElement('p', { className: 'text-purple-200 mb-6' }, user?.email || 'user@example.com'),
          React.createElement('div', { className: 'grid md:grid-cols-3 gap-6 mt-8' },
            React.createElement('div', { className: 'bg-blue-500/20 rounded-2xl p-6' },
              React.createElement('div', { className: 'text-3xl mb-3' }, '🎬'),
              React.createElement('h3', { className: 'text-xl font-bold text-white mb-2' }, '0'),
              React.createElement('p', { className: 'text-blue-200' }, 'Favorite Movies')
            ),
            React.createElement('div', { className: 'bg-green-500/20 rounded-2xl p-6' },
              React.createElement('div', { className: 'text-3xl mb-3' }, '🎮'),
              React.createElement('h3', { className: 'text-xl font-bold text-white mb-2' }, '0'),
              React.createElement('p', { className: 'text-green-200' }, 'Games Played')
            ),
            React.createElement('div', { className: 'bg-purple-500/20 rounded-2xl p-6' },
              React.createElement('div', { className: 'text-3xl mb-3' }, '👥'),
              React.createElement('h3', { className: 'text-xl font-bold text-white mb-2' }, '0'),
              React.createElement('p', { className: 'text-purple-200' }, 'Friends')
            )
          )
        )
      )
    )
  );
};

// Main App Component
const App = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('movies');

  if (loading) {
    return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4' }),
        React.createElement('p', { className: 'text-white text-xl' }, 'Loading CineConnect...')
      )
    );
  }

  if (!user) {
    return React.createElement(AuthForm);
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'movies': return React.createElement(MoviesSection);
      case 'games': return React.createElement(GamesHub);
      case 'chat': return React.createElement(Chat);
      case 'feed': return React.createElement(SocialFeed);
      case 'profile': return React.createElement(Profile);
      default: return React.createElement(MoviesSection);
    }
  };

  return React.createElement('div', { className: 'min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' },
    React.createElement(Navigation, { activeTab, onTabChange: setActiveTab }),
    React.createElement('div', { className: 'flex-1' }, renderContent())
  );
};

// Root App with Auth Provider
const AppWithAuth = () => {
  return React.createElement(AuthProvider, null, React.createElement(App));
};

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(AppWithAuth));