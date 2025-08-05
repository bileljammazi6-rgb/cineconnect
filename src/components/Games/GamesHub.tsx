import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  Trophy, 
  Users, 
  Zap, 
  Grid, 
  BarChart3,
  Star,
  Clock,
  Target,
  Sparkles,
  Play,
  ArrowRight
} from 'lucide-react';
import MovieTrivia from './MovieTrivia';
import MovieBingo from './MovieBingo';
import MoviePolls from '../Social/MoviePolls';

type GameType = 'hub' | 'trivia' | 'bingo' | 'polls';

const GamesHub: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>('hub');

  const games = [
    {
      id: 'trivia' as GameType,
      title: 'Movie Trivia',
      description: 'Test your movie knowledge with questions about popular films, release dates, and ratings',
      icon: Target,
      color: 'from-purple-500 to-blue-600',
      features: ['10 Questions', '15 Second Timer', 'Streak Bonus', 'TMDB Integration'],
      difficulty: 'Medium',
      players: 'Single Player',
      time: '5-10 min'
    },
    {
      id: 'bingo' as GameType,
      title: 'Movie Bingo',
      description: 'Watch movies with friends and mark off squares as you spot classic movie moments',
      icon: Grid,
      color: 'from-pink-500 to-purple-600',
      features: ['5x5 Bingo Grid', 'Party Mode', 'Room Codes', 'Multiple Categories'],
      difficulty: 'Easy',
      players: '1-10 Players',
      time: 'Movie Length'
    },
    {
      id: 'polls' as GameType,
      title: 'Movie Polls',
      description: 'Create and vote on movie polls to decide what to watch with your friends',
      icon: BarChart3,
      color: 'from-indigo-500 to-pink-600',
      features: ['Create Polls', 'TMDB Search', 'Real-time Results', 'Timed Voting'],
      difficulty: 'Easy',
      players: 'Community',
      time: '1-24 hours'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (activeGame !== 'hub') {
    return (
      <div className="relative">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setActiveGame('hub')}
          className="fixed top-4 left-4 z-50 bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white px-4 py-2 rounded-2xl transition-all duration-300 flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Games
        </motion.button>

        <AnimatePresence mode="wait">
          {activeGame === 'trivia' && (
            <motion.div
              key="trivia"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <MovieTrivia />
            </motion.div>
          )}
          {activeGame === 'bingo' && (
            <motion.div
              key="bingo"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <MovieBingo />
            </motion.div>
          )}
          {activeGame === 'polls' && (
            <motion.div
              key="polls"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <MoviePolls />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Gamepad2 className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
            </motion.div>
            
            <h1 className="text-5xl font-bold text-white mb-4">
              🎮 CineConnect Games
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Play interactive movie games, challenge your knowledge, and have fun with friends!
            </p>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white mb-2">3</h3>
                <p className="text-yellow-200">Interactive Games</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6">
                <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white mb-2">Multi-Player</h3>
                <p className="text-blue-200">Play with Friends</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl p-6">
                <Zap className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white mb-2">Real-time</h3>
                <p className="text-green-200">Instant Results</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Games Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden"
            >
              {/* Game Header */}
              <div className={`bg-gradient-to-r ${game.color} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <game.icon className="w-12 h-12 text-white" />
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getDifficultyColor(game.difficulty)}`}>
                      {game.difficulty}
                    </div>
                    <div className="text-white/80 text-sm">{game.players}</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
                <p className="text-white/90 text-sm leading-relaxed">{game.description}</p>
              </div>

              {/* Game Details */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4 text-purple-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{game.time}</span>
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="text-white font-semibold">Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {game.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-purple-200 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveGame(game.id)}
                  className={`w-full bg-gradient-to-r ${game.color} hover:shadow-lg hover:shadow-purple-500/25 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2`}
                >
                  <Play className="w-5 h-5" />
                  Play {game.title}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Coming Soon</h3>
            <p className="text-purple-200 mb-6">
              More exciting games are in development! Stay tuned for movie charades, 
              quote guessing games, and multiplayer movie battles.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-4xl mb-2">🎭</div>
                <div className="text-white font-semibold">Movie Charades</div>
                <div className="text-purple-300 text-sm">Act out movie titles</div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-4xl mb-2">💬</div>
                <div className="text-white font-semibold">Quote Master</div>
                <div className="text-purple-300 text-sm">Guess the movie quote</div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-4xl mb-2">⚔️</div>
                <div className="text-white font-semibold">Movie Battles</div>
                <div className="text-purple-300 text-sm">Head-to-head trivia</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 text-purple-300"
        >
          <p className="text-sm">
            🎬 Powered by TMDB API • Built for movie lovers • Have fun and compete with friends!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GamesHub;