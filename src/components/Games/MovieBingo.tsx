import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Trophy, Users, RefreshCw, CheckCircle2, Sparkles, Download, Share } from 'lucide-react';
import toast from 'react-hot-toast';

interface BingoSquare {
  id: number;
  text: string;
  checked: boolean;
  category: 'action' | 'dialogue' | 'visual' | 'sound' | 'plot';
}

const MovieBingo: React.FC = () => {
  const [bingoBoard, setBingoBoard] = useState<BingoSquare[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [completedLines, setCompletedLines] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [gameMode, setGameMode] = useState<'classic' | 'speed' | 'party'>('classic');
  const [timeLeft, setTimeLeft] = useState(0);
  const [roomCode, setRoomCode] = useState('');

  const bingoSquares = {
    action: [
      "Car chase scene",
      "Explosion in background",
      "Someone falls down",
      "Fight scene",
      "Someone runs",
      "Door gets slammed",
      "Someone gets punched",
      "Jumping scene",
      "Someone climbs something",
      "Chase on foot"
    ],
    dialogue: [
      '"I\'ll be back"',
      "Someone says 'What?!'",
      "Dramatic 'No!'",
      "Phone conversation",
      "Someone whispers",
      "Awkward silence",
      "Someone screams",
      "Love confession",
      "Plot twist revealed",
      "Character name mentioned"
    ],
    visual: [
      "Sunset/sunrise scene",
      "Rain in the scene",
      "Someone wears sunglasses",
      "Close-up of eyes",
      "Mirror reflection",
      "Fire in the scene",
      "Someone looks through window",
      "Slow motion scene",
      "Flashback sequence",
      "Someone in formal wear"
    ],
    sound: [
      "Dramatic music swell",
      "Sound of thunder",
      "Phone ringing",
      "Door creaking",
      "Car engine sound",
      "Gunshot sound",
      "Footsteps",
      "Glass breaking",
      "Applause",
      "Silence for effect"
    ],
    plot: [
      "Plot twist",
      "Flashback",
      "Someone betrays someone",
      "Character dies",
      "New character introduced",
      "Problem gets solved",
      "Someone lies",
      "Secret revealed",
      "Romance moment",
      "Cliffhanger ending"
    ]
  };

  const generateBingoBoard = (): BingoSquare[] => {
    const allSquares = Object.values(bingoSquares).flat();
    const shuffled = allSquares.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 24); // 24 squares + 1 free space
    
    const board: BingoSquare[] = selected.map((text, index) => ({
      id: index,
      text,
      checked: false,
      category: Object.entries(bingoSquares).find(([_, squares]) => 
        squares.includes(text)
      )?.[0] as BingoSquare['category'] || 'action'
    }));

    // Add free space in the middle
    board.splice(12, 0, {
      id: 12,
      text: "FREE SPACE",
      checked: true,
      category: 'action'
    });

    return board;
  };

  const startGame = () => {
    const newBoard = generateBingoBoard();
    setBingoBoard(newBoard);
    setGameStarted(true);
    setCompletedLines([]);
    setScore(0);
    setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
    
    if (gameMode === 'speed') {
      setTimeLeft(300); // 5 minutes for speed mode
    }
    
    toast.success('Bingo game started! 🎬', {
      icon: '🎯'
    });
  };

  const toggleSquare = (id: number) => {
    if (!gameStarted) return;
    
    setBingoBoard(prev => prev.map(square => 
      square.id === id 
        ? { ...square, checked: !square.checked }
        : square
    ));
    
    toast.success('Square marked! 🎯', {
      duration: 1000
    });
  };

  const checkForBingo = (board: BingoSquare[]): number[] => {
    const lines = [];
    
    // Check rows
    for (let i = 0; i < 5; i++) {
      const row = board.slice(i * 5, (i + 1) * 5);
      if (row.every(square => square.checked)) {
        lines.push(i); // Row numbers 0-4
      }
    }
    
    // Check columns
    for (let i = 0; i < 5; i++) {
      const column = [];
      for (let j = 0; j < 5; j++) {
        column.push(board[j * 5 + i]);
      }
      if (column.every(square => square.checked)) {
        lines.push(i + 5); // Column numbers 5-9
      }
    }
    
    // Check diagonals
    const diagonal1 = [board[0], board[6], board[12], board[18], board[24]];
    if (diagonal1.every(square => square.checked)) {
      lines.push(10); // Main diagonal
    }
    
    const diagonal2 = [board[4], board[8], board[12], board[16], board[20]];
    if (diagonal2.every(square => square.checked)) {
      lines.push(11); // Anti-diagonal
    }
    
    return lines;
  };

  useEffect(() => {
    if (gameStarted && bingoBoard.length > 0) {
      const newCompletedLines = checkForBingo(bingoBoard);
      const newLines = newCompletedLines.filter(line => !completedLines.includes(line));
      
      if (newLines.length > 0) {
        setCompletedLines(newCompletedLines);
        const newScore = newCompletedLines.length * 100;
        setScore(newScore);
        
        if (newLines.length === 1) {
          toast.success('BINGO! 🎉', {
            icon: '🏆',
            duration: 3000
          });
        } else {
          toast.success(`Multiple BINGO! ${newCompletedLines.length} lines! 🔥`, {
            icon: '🎊',
            duration: 3000
          });
        }
      }
    }
  }, [bingoBoard, gameStarted]);

  // Timer for speed mode
  useEffect(() => {
    if (gameMode === 'speed' && timeLeft > 0 && gameStarted) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameMode === 'speed' && gameStarted) {
      toast.error('Time\'s up! 🕐');
      setGameStarted(false);
    }
  }, [timeLeft, gameMode, gameStarted]);

  const getCategoryColor = (category: BingoSquare['category']) => {
    switch (category) {
      case 'action': return 'bg-red-500/20 border-red-400';
      case 'dialogue': return 'bg-blue-500/20 border-blue-400';
      case 'visual': return 'bg-green-500/20 border-green-400';
      case 'sound': return 'bg-yellow-500/20 border-yellow-400';
      case 'plot': return 'bg-purple-500/20 border-purple-400';
      default: return 'bg-gray-500/20 border-gray-400';
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 p-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8">
              <Grid className="w-20 h-20 text-pink-400 mx-auto mb-6" />
              <h1 className="text-5xl font-bold text-white mb-4">
                🎬 Movie Bingo
              </h1>
              <p className="text-xl text-purple-200 mb-8">
                Watch movies with friends and mark off squares as you spot these moments!
              </p>

              {/* Game Mode Selection */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameMode('classic')}
                  className={`p-6 rounded-2xl transition-all duration-300 ${
                    gameMode === 'classic' 
                      ? 'bg-pink-500/30 border-2 border-pink-400' 
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <Trophy className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Classic</h3>
                  <p className="text-purple-200">No time limit, play at your own pace</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameMode('speed')}
                  className={`p-6 rounded-2xl transition-all duration-300 ${
                    gameMode === 'speed' 
                      ? 'bg-pink-500/30 border-2 border-pink-400' 
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Speed Round</h3>
                  <p className="text-purple-200">5-minute challenge mode</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameMode('party')}
                  className={`p-6 rounded-2xl transition-all duration-300 ${
                    gameMode === 'party' 
                      ? 'bg-pink-500/30 border-2 border-pink-400' 
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <Users className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Party Mode</h3>
                  <p className="text-purple-200">Perfect for watching with friends</p>
                </motion.button>
              </div>

              {/* How to Play */}
              <div className="bg-purple-500/20 rounded-2xl p-6 mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">How to Play</h3>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <p className="text-purple-200">• 🎯 Watch a movie with your bingo card</p>
                    <p className="text-purple-200">• ✅ Mark squares when you see those moments</p>
                    <p className="text-purple-200">• 🏆 Get BINGO by completing a line (row, column, or diagonal)</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-purple-200">• 🎨 Squares are color-coded by category</p>
                    <p className="text-purple-200">• 🎊 Multiple lines = higher score</p>
                    <p className="text-purple-200">• 👥 Share your room code with friends</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300"
              >
                Start {gameMode === 'classic' ? 'Classic' : gameMode === 'speed' ? 'Speed' : 'Party'} Game
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-3">
            <span className="text-white font-bold">Score: {score}</span>
            {completedLines.length > 0 && (
              <span className="text-pink-400 ml-4">🏆 {completedLines.length} BINGO{completedLines.length > 1 ? 'S' : ''}</span>
            )}
          </div>

          {gameMode === 'speed' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-3">
              <span className={`font-bold ${timeLeft <= 60 ? 'text-red-400' : 'text-white'}`}>
                ⏰ {formatTime(timeLeft)}
              </span>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-3">
            <span className="text-white">Room: <span className="font-bold text-pink-400">{roomCode}</span></span>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigator.share?.({ text: `Join my Movie Bingo game! Room code: ${roomCode}` })}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-white p-3 rounded-xl transition-all duration-300"
            >
              <Share className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-white p-3 rounded-xl transition-all duration-300"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(bingoSquares).map(([category, _]) => (
              <div key={category} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-2 ${getCategoryColor(category as BingoSquare['category'])}`} />
                <span className="text-white capitalize">{category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bingo Board */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
          <div className="grid grid-cols-5 gap-3 max-w-4xl mx-auto">
            {bingoBoard.map((square, index) => (
              <motion.button
                key={square.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSquare(square.id)}
                className={`
                  aspect-square p-3 rounded-2xl border-2 text-sm font-semibold transition-all duration-300
                  ${square.checked 
                    ? 'bg-green-500/40 border-green-400 text-white' 
                    : getCategoryColor(square.category)
                  }
                  ${square.text === 'FREE SPACE' ? 'bg-gradient-to-br from-yellow-500/40 to-orange-500/40 border-yellow-400' : ''}
                  hover:shadow-lg hover:brightness-110
                `}
                disabled={square.text === 'FREE SPACE'}
              >
                <div className="flex flex-col items-center justify-center h-full relative">
                  {square.checked && square.text !== 'FREE SPACE' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </motion.div>
                  )}
                  
                  <span className={`text-center leading-tight ${
                    square.text.length > 15 ? 'text-xs' : 'text-sm'
                  }`}>
                    {square.text}
                  </span>
                  
                  {square.text === 'FREE SPACE' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Success Animation */}
          <AnimatePresence>
            {completedLines.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center mt-6"
              >
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6">
                  <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {completedLines.length === 1 ? 'BINGO!' : `${completedLines.length} BINGOS!`}
                  </h3>
                  <p className="text-yellow-200">
                    You've completed {completedLines.length} line{completedLines.length > 1 ? 's' : ''}! Keep watching for more! 🎬
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MovieBingo;