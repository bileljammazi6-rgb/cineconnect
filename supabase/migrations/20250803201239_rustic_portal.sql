/*
  # Create tic tac toe games table for multiplayer gaming

  1. New Tables
    - `tic_tac_toe_games`
      - `id` (uuid, primary key)
      - `player_x` (uuid, references users.id)
      - `player_o` (uuid, references users.id, nullable)
      - `board` (jsonb, game board state)
      - `current_player` (text, 'X' or 'O')
      - `winner` (text, 'X', 'O', 'draw', or null)
      - `status` (text, 'waiting', 'playing', 'finished')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `tic_tac_toe_games` table
    - Add policies for game management
    - Players can read games they're part of
    - Players can update games they're part of
    - Anyone can create new games
    - Anyone can join waiting games
*/

CREATE TABLE IF NOT EXISTS tic_tac_toe_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_x uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  player_o uuid REFERENCES users(id) ON DELETE CASCADE,
  board jsonb DEFAULT '[]'::jsonb,
  current_player text DEFAULT 'X' CHECK (current_player IN ('X', 'O')),
  winner text CHECK (winner IN ('X', 'O', 'draw')),
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tic_tac_toe_games ENABLE ROW LEVEL SECURITY;

-- Players can read games they're part of or waiting games
CREATE POLICY "Users can read relevant games"
  ON tic_tac_toe_games
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = player_x OR 
    auth.uid() = player_o OR 
    status = 'waiting'
  );

-- Users can create new games
CREATE POLICY "Users can create games"
  ON tic_tac_toe_games
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_x);

-- Players can update games they're part of
CREATE POLICY "Players can update their games"
  ON tic_tac_toe_games
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = player_x OR 
    auth.uid() = player_o OR
    (status = 'waiting' AND player_o IS NULL)
  )
  WITH CHECK (
    auth.uid() = player_x OR 
    auth.uid() = player_o OR
    (status = 'waiting' AND player_o IS NULL)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_games_status ON tic_tac_toe_games(status);
CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_games_player_x ON tic_tac_toe_games(player_x);
CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_games_player_o ON tic_tac_toe_games(player_o);
CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_games_created_at ON tic_tac_toe_games(created_at);

-- Update trigger for updated_at
CREATE TRIGGER update_tic_tac_toe_games_updated_at
  BEFORE UPDATE ON tic_tac_toe_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();