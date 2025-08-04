import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Trophy, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

type Player = 'X' | 'O' | null;
type Board = Player[];

interface GameState {
  id: string;
  board: Board;
  current_player: 'X' | 'O';
  player_x: string;
  player_o: string | null;
  winner: Player;
  status: 'waiting' | 'playing' | 'finished';
  created_at: string;
}

export function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOnline && user) {
      findOrCreateGame();
    }
  }, [isOnline, user]);

  useEffect(() => {
    if (gameState) {
      subscribeToGame();
    }
  }, [gameState?.id]);

  const findOrCreateGame = async () => {
    try {
      // First, try to find a waiting game
      const { data: waitingGames, error: findError } = await supabase
        .from('tic_tac_toe_games')
        .select('*')
        .eq('status', 'waiting')
        .neq('player_x', user?.id)
        .limit(1);

      if (findError) throw findError;

      if (waitingGames && waitingGames.length > 0) {
        // Join existing game
        const game = waitingGames[0];
        const { error: updateError } = await supabase
          .from('tic_tac_toe_games')
          .update({
            player_o: user?.id,
            status: 'playing'
          })
          .eq('id', game.id);

        if (updateError) throw updateError;
        
        setGameState({ ...game, player_o: user?.id, status: 'playing' });
        setWaitingForPlayer(false);
        toast.success('Joined game! You are O');
      } else {
        // Create new game
        const { data: newGame, error: createError } = await supabase
          .from('tic_tac_toe_games')
          .insert({
            player_x: user?.id,
            board: Array(9).fill(null),
            current_player: 'X',
            status: 'waiting'
          })
          .select()
          .single();

        if (createError) throw createError;
        
        setGameState(newGame);
        setWaitingForPlayer(true);
        toast.success('Game created! Waiting for opponent...');
      }
    } catch (error) {
      console.error('Error with online game:', error);
      toast.error('Failed to start online game');
    }
  };

  const subscribeToGame = () => {
    if (!gameState?.id) return;

    const channel = supabase
      .channel(`game-${gameState.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tic_tac_toe_games',
          filter: `id=eq.${gameState.id}`,
        },
        (payload) => {
          const updatedGame = payload.new as GameState;
          setGameState(updatedGame);
          setBoard(updatedGame.board);
          setCurrentPlayer(updatedGame.current_player);
          setWinner(updatedGame.winner);
          
          if (updatedGame.status === 'playing' && waitingForPlayer) {
            setWaitingForPlayer(false);
            toast.success('Opponent joined!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateWinner = (squares: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    return squares.every(square => square !== null) ? 'Draw' as Player : null;
  };

  const makeMove = async (index: number) => {
    if (board[index] || winner) return;

    if (isOnline && gameState) {
      // Online game logic
      if (gameState.status !== 'playing') return;
      
      const isPlayerX = gameState.player_x === user?.id;
      const isPlayerO = gameState.player_o === user?.id;
      
      if ((currentPlayer === 'X' && !isPlayerX) || (currentPlayer === 'O' && !isPlayerO)) {
        toast.error("It's not your turn!");
        return;
      }

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      const newWinner = calculateWinner(newBoard);
      const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';

      try {
        const { error } = await supabase
          .from('tic_tac_toe_games')
          .update({
            board: newBoard,
            current_player: newWinner ? currentPlayer : nextPlayer,
            winner: newWinner,
            status: newWinner ? 'finished' : 'playing'
          })
          .eq('id', gameState.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error making move:', error);
        toast.error('Failed to make move');
      }
    } else {
      // Local game logic
      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const newWinner = calculateWinner(newBoard);
      if (newWinner) {
        setWinner(newWinner);
        if (newWinner === 'Draw') {
          toast.success("It's a draw!");
        } else {
          toast.success(`Player ${newWinner} wins!`);
        }
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setGameState(null);
    setIsOnline(false);
    setWaitingForPlayer(false);
  };

  const getPlayerSymbol = () => {
    if (!isOnline || !gameState || !user) return null;
    return gameState.player_x === user.id ? 'X' : 'O';
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tic Tac Toe</h2>
        
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setIsOnline(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !isOnline ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Local Game
          </button>
          <button
            onClick={() => setIsOnline(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isOnline ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Online
          </button>
        </div>

        {waitingForPlayer ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Waiting for opponent...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {winner ? (
              <div className="flex items-center gap-2 text-green-600">
                <Trophy className="w-5 h-5" />
                {winner === 'Draw' ? "It's a draw!" : `Player ${winner} wins!`}
              </div>
            ) : (
              <p className="text-gray-600">
                {isOnline && gameState ? 
                  `Your symbol: ${getPlayerSymbol()} | Current turn: ${currentPlayer}` :
                  `Current player: ${currentPlayer}`
                }
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {board.map((cell, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => makeMove(index)}
            disabled={!!cell || !!winner || waitingForPlayer}
            className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl font-bold hover:bg-gray-200 disabled:cursor-not-allowed transition-colors"
          >
            {cell && (
              <span className={cell === 'X' ? 'text-blue-500' : 'text-red-500'}>
                {cell}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetGame}
          className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          New Game
        </motion.button>
      </div>
    </div>
  );
}