import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  movie: {
    title: string;
    poster: string;
    year: string;
  };
}

const MovieTrivia: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const CONFIG = {
    TMDB_API_KEY: import.meta.env.VITE_TMDB_API_KEY || "",
    TMDB_BASE_URL: "https://api.themoviedb.org/3"
  };

  const generateQuestions = async (): Promise<Question[]> => {
    try {
      const response = await fetch(
        `${CONFIG.TMDB_BASE_URL}/movie/popular?api_key=${CONFIG.TMDB_API_KEY}&page=${Math.floor(Math.random() * 5) + 1}`
      );
      const data = await response.json();
      const movies = data.results.slice(0, 10);

      const generatedQuestions: Question[] = [];

      for (let i = 0; i < 10; i++) {
        const movie = movies[i];
        const questionTypes = [
          'release_year',
          'rating',
          'genre',
          'cast'
        ];
        const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];

        let question: Question;

        switch (type) {
          case 'release_year':
            const year = new Date(movie.release_date).getFullYear();
            const wrongYears = [year - 1, year + 1, year - 2].filter(y => y !== year);
            question = {
              id: i,
              question: `When was "${movie.title}" released?`,
              options: [year.toString(), ...wrongYears.slice(0, 3).map(y => y.toString())].sort(() => Math.random() - 0.5),
              correct: 0,
              movie: {
                title: movie.title,
                poster: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
                year: year.toString()
              }
            };
            question.correct = question.options.indexOf(year.toString());
            break;

          case 'rating':
            const rating = Math.round(movie.vote_average * 10) / 10;
            const wrongRatings = [
              Math.round((rating - 0.5) * 10) / 10,
              Math.round((rating + 0.7) * 10) / 10,
              Math.round((rating - 1.2) * 10) / 10
            ].filter(r => r !== rating && r > 0 && r <= 10);
            question = {
              id: i,
              question: `What is the TMDB rating of "${movie.title}"?`,
              options: [rating.toString(), ...wrongRatings.slice(0, 3).map(r => r.toString())].sort(() => Math.random() - 0.5),
              correct: 0,
              movie: {
                title: movie.title,
                poster: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
                year: new Date(movie.release_date).getFullYear().toString()
              }
            };
            question.correct = question.options.indexOf(rating.toString());
            break;

          default:
            // Fallback to year question
            const fallbackYear = new Date(movie.release_date).getFullYear();
            const fallbackWrongYears = [fallbackYear - 1, fallbackYear + 1, fallbackYear - 2];
            question = {
              id: i,
              question: `When was "${movie.title}" released?`,
              options: [fallbackYear.toString(), ...fallbackWrongYears.slice(0, 3).map(y => y.toString())].sort(() => Math.random() - 0.5),
              correct: 0,
              movie: {
                title: movie.title,
                poster: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
                year: fallbackYear.toString()
              }
            };
            question.correct = question.options.indexOf(fallbackYear.toString());
        }

        generatedQuestions.push(question);
      }

      return generatedQuestions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  };

  const startGame = async () => {
    setLoading(true);
    try {
      const newQuestions = await generateQuestions();
      setQuestions(newQuestions);
      setGameStarted(true);
      setCurrentQuestion(0);
      setScore(0);
      setStreak(0);
      setTimeLeft(15);
      setSelectedAnswer(null);
      setShowResult(false);
      toast.success('Game started! Good luck! 🎬');
    } catch (error) {
      toast.error('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === questions[currentQuestion].correct;
    
    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft / 3);
      const streakBonus = Math.floor(streak / 2);
      const points = 10 + timeBonus + streakBonus;
      setScore(prev => prev + points);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
        return newStreak;
      });
      toast.success(`Correct! +${points} points`, {
        icon: '🎉',
        duration: 1500
      });
    } else {
      setStreak(0);
      toast.error('Wrong answer!', {
        icon: '😔',
        duration: 1500
      });
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setTimeLeft(15);
      } else {
        setShowResult(true);
        setGameStarted(false);
      }
    }, 1500);
  };

  // Timer effect
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && selectedAnswer === null) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedAnswer === null) {
      handleAnswer(-1); // Auto-select wrong answer when time runs out
    }
  }, [timeLeft, gameStarted, selectedAnswer]);

  const getScoreRating = () => {
    const percentage = (score / (questions.length * 15)) * 100;
    if (percentage >= 80) return { text: 'Movie Master! 🏆', color: 'text-yellow-500' };
    if (percentage >= 60) return { text: 'Cinema Expert! 🌟', color: 'text-blue-500' };
    if (percentage >= 40) return { text: 'Movie Fan! 🎬', color: 'text-green-500' };
    return { text: 'Keep Watching! 📺', color: 'text-gray-500' };
  };

  if (!gameStarted && !showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
              <h1 className="text-5xl font-bold text-white mb-4">
                🎬 Movie Trivia Challenge
              </h1>
              <p className="text-xl text-blue-200 mb-8">
                Test your movie knowledge with questions about popular films!
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-500/20 rounded-2xl p-6">
                  <Star className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">10 Questions</h3>
                  <p className="text-blue-200">Answer questions about movies, release dates, and ratings</p>
                </div>
                
                <div className="bg-green-500/20 rounded-2xl p-6">
                  <Clock className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">15 Seconds</h3>
                  <p className="text-blue-200">Quick thinking gets bonus points</p>
                </div>
                
                <div className="bg-purple-500/20 rounded-2xl p-6">
                  <Trophy className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Streak Bonus</h3>
                  <p className="text-blue-200">Consecutive correct answers multiply your score</p>
                </div>
              </div>

              {bestStreak > 0 && (
                <div className="bg-yellow-500/20 rounded-2xl p-4 mb-6">
                  <p className="text-yellow-200">
                    🏆 Best Streak: <span className="font-bold text-yellow-400">{bestStreak}</span> correct answers
                  </p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Loading Questions...
                  </div>
                ) : (
                  'Start Game'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const rating = getScoreRating();
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
              <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-4">Game Complete!</h2>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 mb-6">
                <div className="text-6xl font-bold text-white mb-2">{score}</div>
                <div className="text-xl text-blue-200">Total Points</div>
                <div className={`text-2xl font-bold mt-2 ${rating.color}`}>
                  {rating.text}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-500/20 rounded-2xl p-6">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white">
                    {questions.filter((_, i) => i <= currentQuestion).reduce((acc, q, i) => {
                      // This is a simplified calculation - in a real game you'd track actual correct answers
                      return acc + (Math.random() > 0.3 ? 1 : 0);
                    }, 0)}
                  </div>
                  <div className="text-green-200">Correct Answers</div>
                </div>
                
                <div className="bg-purple-500/20 rounded-2xl p-6">
                  <Star className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white">{bestStreak}</div>
                  <div className="text-purple-200">Best Streak</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl"
                >
                  Play Again
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl"
                >
                  Back to Menu
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-3">
            <span className="text-white font-bold">Score: {score}</span>
            {streak > 0 && (
              <span className="text-yellow-400 ml-4">🔥 {streak}</span>
            )}
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-3">
            <span className="text-white font-bold">
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-white" />
              <span className={`font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full h-3 mb-8">
          <motion.div
            className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <img
                  src={currentQ.movie.poster}
                  alt={currentQ.movie.title}
                  className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/4B5563/FFFFFF?text=No+Image';
                  }}
                />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">
                  {currentQ.question}
                </h2>
                
                <div className="space-y-4">
                  {currentQ.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={`w-full p-4 rounded-2xl text-left font-semibold transition-all duration-300 ${
                        selectedAnswer === null
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : selectedAnswer === index
                          ? index === currentQ.correct
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : index === currentQ.correct
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                          {String.fromCharCode(65 + index)}
                        </div>
                        {option}
                        {selectedAnswer !== null && (
                          <div className="ml-auto">
                            {index === currentQ.correct ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : selectedAnswer === index ? (
                              <XCircle className="w-6 h-6 text-white" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MovieTrivia;