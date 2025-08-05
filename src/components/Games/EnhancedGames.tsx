import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface GameStats {
  rock_paper_scissors?: number;
  word_guess?: number;
  reaction_time?: number;
}

interface RockPaperScissorsChoice {
  rock: string;
  paper: string;
  scissors: string;
}

interface WordGameState {
  word: string;
  guessedLetters: string[];
  wrongGuesses: number;
  maxWrongGuesses: number;
  gameStatus: 'playing' | 'won' | 'lost';
}

interface ReactionGameState {
  isWaiting: boolean;
  startTime: number;
  reactionTime: number;
  bestTime: number;
  attempts: number;
}

export const EnhancedGames: React.FC = () => {
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<GameStats>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [rpsPlayerChoice, setRpsPlayerChoice] = useState<string | null>(null);
  const [rpsComputerChoice, setRpsComputerChoice] = useState<string | null>(null);
  const [rpsResult, setRpsResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [rpsScore, setRpsScore] = useState({ wins: 0, losses: 0, draws: 0 });

  const [wordGame, setWordGame] = useState<WordGameState>({
    word: '',
    guessedLetters: [],
    wrongGuesses: 0,
    maxWrongGuesses: 6,
    gameStatus: 'playing'
  });

  const [reactionGame, setReactionGame] = useState<ReactionGameState>({
    isWaiting: false,
    startTime: 0,
    reactionTime: 0,
    bestTime: Infinity,
    attempts: 0
  });

  const choices: RockPaperScissorsChoice = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
  };

  const movieWords = [
    'CINEMA', 'DIRECTOR', 'ACTOR', 'SCRIPT', 'CAMERA', 'SCENE', 'DRAMA',
    'COMEDY', 'THRILLER', 'HORROR', 'ACTION', 'ROMANCE', 'FANTASY',
    'DOCUMENTARY', 'ANIMATION', 'BLOCKBUSTER', 'PREMIERE', 'OSCAR',
    'HOLLYWOOD', 'BOLLYWOOD', 'NETFLIX', 'STREAMING', 'THEATER'
  ];

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchLeaderboard();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('game_scores')
      .select('game_type, score')
      .eq('user_id', user.id);

    if (data) {
      const stats: GameStats = {};
      data.forEach(score => {
        stats[score.game_type as keyof GameStats] = Math.max(
          stats[score.game_type as keyof GameStats] || 0,
          score.score
        );
      });
      setUserStats(stats);
    }
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('game_scores')
      .select(`
        game_type,
        score,
        users (username, full_name)
      `)
      .order('score', { ascending: false })
      .limit(10);

    setLeaderboard(data || []);
  };

  const saveScore = async (gameType: string, score: number) => {
    if (!user) return;

    await supabase.from('game_scores').insert({
      user_id: user.id,
      game_type: gameType,
      score
    });

    fetchUserStats();
    fetchLeaderboard();
  };

  const playRockPaperScissors = (playerChoice: string) => {
    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * choices.length)];

    setRpsPlayerChoice(playerChoice);
    setRpsComputerChoice(computerChoice);

    let result: 'win' | 'lose' | 'draw';
    if (playerChoice === computerChoice) {
      result = 'draw';
      setRpsScore(prev => ({ ...prev, draws: prev.draws + 1 }));
    } else if (
      (playerChoice === 'rock' && computerChoice === 'scissors') ||
      (playerChoice === 'paper' && computerChoice === 'rock') ||
      (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
      result = 'win';
      setRpsScore(prev => ({ ...prev, wins: prev.wins + 1 }));
      saveScore('rock_paper_scissors', rpsScore.wins + 1);
    } else {
      result = 'lose';
      setRpsScore(prev => ({ ...prev, losses: prev.losses + 1 }));
    }

    setRpsResult(result);
  };

  const startWordGame = () => {
    const randomWord = movieWords[Math.floor(Math.random() * movieWords.length)];
    setWordGame({
      word: randomWord,
      guessedLetters: [],
      wrongGuesses: 0,
      maxWrongGuesses: 6,
      gameStatus: 'playing'
    });
  };

  const guessLetter = (letter: string) => {
    if (wordGame.guessedLetters.includes(letter) || wordGame.gameStatus !== 'playing') return;

    const newGuessedLetters = [...wordGame.guessedLetters, letter];
    const isCorrect = wordGame.word.includes(letter);

    let newWrongGuesses = wordGame.wrongGuesses;
    if (!isCorrect) {
      newWrongGuesses++;
    }

    let gameStatus: 'playing' | 'won' | 'lost' = 'playing';
    const wordComplete = wordGame.word.split('').every(char => newGuessedLetters.includes(char));

    if (wordComplete) {
      gameStatus = 'won';
      const score = Math.max(0, 100 - (newWrongGuesses * 10) - (newGuessedLetters.length * 2));
      saveScore('word_guess', score);
      toast.success(`Congratulations! You scored ${score} points!`);
    } else if (newWrongGuesses >= wordGame.maxWrongGuesses) {
      gameStatus = 'lost';
      toast.error(`Game over! The word was: ${wordGame.word}`);
    }

    setWordGame({
      ...wordGame,
      guessedLetters: newGuessedLetters,
      wrongGuesses: newWrongGuesses,
      gameStatus
    });
  };

  const startReactionTest = () => {
    setReactionGame({
      ...reactionGame,
      isWaiting: true,
      startTime: 0,
      reactionTime: 0
    });

    const delay = Math.random() * 3000 + 1000;
    setTimeout(() => {
      setReactionGame(prev => ({
        ...prev,
        isWaiting: false,
        startTime: Date.now()
      }));
    }, delay);
  };

  const handleReactionClick = () => {
    if (reactionGame.isWaiting) {
      toast.error('Too early! Wait for the green signal.');
      setReactionGame({
        ...reactionGame,
        isWaiting: false,
        startTime: 0
      });
    } else if (reactionGame.startTime > 0) {
      const reactionTime = Date.now() - reactionGame.startTime;
      const newBestTime = Math.min(reactionGame.bestTime, reactionTime);
      const newAttempts = reactionGame.attempts + 1;

      setReactionGame({
        ...reactionGame,
        reactionTime,
        bestTime: newBestTime,
        attempts: newAttempts,
        startTime: 0
      });

      if (reactionTime === newBestTime) {
        saveScore('reaction_time', Math.max(0, 1000 - reactionTime));
      }
    } else {
      startReactionTest();
    }
  };

  const renderWordDisplay = () => {
    return wordGame.word.split('').map((letter, index) => (
      <span key={index} className="mx-1 text-2xl font-mono">
        {wordGame.guessedLetters.includes(letter) ? letter : '_'}
      </span>
    ));
  };

  const renderAlphabet = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return alphabet.map(letter => (
      <button
        key={letter}
        onClick={() => guessLetter(letter)}
        disabled={wordGame.guessedLetters.includes(letter) || wordGame.gameStatus !== 'playing'}
        className={`m-1 w-8 h-8 rounded text-sm font-semibold transition-colors ${
          wordGame.guessedLetters.includes(letter)
            ? wordGame.word.includes(letter)
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        } disabled:cursor-not-allowed`}
      >
        {letter}
      </button>
    ));
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to play games.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Game Center</h2>
        <p className="text-gray-600">Challenge yourself and compete with friends!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`p-6 rounded-lg border-2 cursor-pointer transition-colors ${
            activeGame === 'rps' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setActiveGame(activeGame === 'rps' ? null : 'rps')}
        >
          <div className="text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold">Rock Paper Scissors</h3>
            <p className="text-sm text-gray-600">Classic strategy game</p>
            {userStats.rock_paper_scissors && (
              <p className="text-xs text-green-600 mt-1">Best: {userStats.rock_paper_scissors} wins</p>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`p-6 rounded-lg border-2 cursor-pointer transition-colors ${
            activeGame === 'word' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setActiveGame(activeGame === 'word' ? null : 'word')}
        >
          <div className="text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold">Word Guess</h3>
            <p className="text-sm text-gray-600">Movie-themed hangman</p>
            {userStats.word_guess && (
              <p className="text-xs text-green-600 mt-1">Best: {userStats.word_guess} points</p>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`p-6 rounded-lg border-2 cursor-pointer transition-colors ${
            activeGame === 'reaction' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setActiveGame(activeGame === 'reaction' ? null : 'reaction')}
        >
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <h3 className="font-semibold">Reaction Time</h3>
            <p className="text-sm text-gray-600">Test your reflexes</p>
            {userStats.reaction_time && (
              <p className="text-xs text-green-600 mt-1">Best: {userStats.reaction_time} points</p>
            )}
          </div>
        </motion.div>
      </div>

      {activeGame === 'rps' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border"
        >
          <h3 className="text-xl font-semibold mb-4 text-center">Rock Paper Scissors</h3>
          
          <div className="text-center mb-6">
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">You</p>
                <div className="text-6xl">{rpsPlayerChoice ? choices[rpsPlayerChoice as keyof RockPaperScissorsChoice] : '❓'}</div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Computer</p>
                <div className="text-6xl">{rpsComputerChoice ? choices[rpsComputerChoice as keyof RockPaperScissorsChoice] : '❓'}</div>
              </div>
            </div>
            
            {rpsResult && (
              <div className={`text-xl font-bold mb-4 ${
                rpsResult === 'win' ? 'text-green-600' : 
                rpsResult === 'lose' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {rpsResult === 'win' ? '🎉 You Win!' : 
                 rpsResult === 'lose' ? '😔 You Lose!' : '🤝 It\'s a Draw!'}
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 mb-6">
            {Object.entries(choices).map(([choice, emoji]) => (
              <button
                key={choice}
                onClick={() => playRockPaperScissors(choice)}
                className="p-4 text-4xl bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Wins: {rpsScore.wins} | Losses: {rpsScore.losses} | Draws: {rpsScore.draws}</p>
          </div>
        </motion.div>
      )}

      {activeGame === 'word' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border"
        >
          <h3 className="text-xl font-semibold mb-4 text-center">Movie Word Guess</h3>
          
          {wordGame.word ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="text-center mb-4">
                  {renderWordDisplay()}
                </div>
                <p className="text-sm text-gray-600">
                  Wrong guesses: {wordGame.wrongGuesses}/{wordGame.maxWrongGuesses}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex flex-wrap justify-center">
                  {renderAlphabet()}
                </div>
              </div>

              {wordGame.gameStatus !== 'playing' && (
                <button
                  onClick={startWordGame}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Play Again
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-4 text-gray-600">Guess the movie-related word!</p>
              <button
                onClick={startWordGame}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Game
              </button>
            </div>
          )}
        </motion.div>
      )}

      {activeGame === 'reaction' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border"
        >
          <h3 className="text-xl font-semibold mb-4 text-center">Reaction Time Test</h3>
          
          <div className="text-center">
            <div
              onClick={handleReactionClick}
              className={`w-64 h-64 mx-auto mb-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                reactionGame.isWaiting 
                  ? 'bg-red-500 text-white' 
                  : reactionGame.startTime > 0 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              <div className="text-center">
                {reactionGame.isWaiting ? (
                  <div>
                    <div className="text-2xl mb-2">⏳</div>
                    <div>Wait...</div>
                  </div>
                ) : reactionGame.startTime > 0 ? (
                  <div>
                    <div className="text-2xl mb-2">⚡</div>
                    <div>Click Now!</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl mb-2">🎯</div>
                    <div>Click to Start</div>
                  </div>
                )}
              </div>
            </div>

            {reactionGame.reactionTime > 0 && (
              <div className="mb-4">
                <p className="text-xl font-bold text-blue-600">
                  {reactionGame.reactionTime}ms
                </p>
                <p className="text-sm text-gray-600">
                  {reactionGame.reactionTime < 200 ? 'Lightning fast!' :
                   reactionGame.reactionTime < 300 ? 'Excellent!' :
                   reactionGame.reactionTime < 400 ? 'Good!' :
                   reactionGame.reactionTime < 500 ? 'Not bad!' : 'Keep practicing!'}
                </p>
              </div>
            )}

            {reactionGame.bestTime < Infinity && (
              <div className="text-sm text-gray-600">
                <p>Best time: {reactionGame.bestTime}ms</p>
                <p>Attempts: {reactionGame.attempts}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-xl font-semibold">Leaderboard</h3>
        </div>
        
        <div className="space-y-2">
          {leaderboard.slice(0, 5).map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {index + 1}
                </span>
                <span className="font-medium">
                  {entry.users?.full_name || entry.users?.username || 'Anonymous'}
                </span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{entry.score} pts</p>
                <p className="text-xs text-gray-500 capitalize">{entry.game_type.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
