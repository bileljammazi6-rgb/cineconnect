/*
  # Create Movie Invitations System

  1. New Tables
    - `movie_invitations`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references users)
      - `recipient_id` (uuid, references users)
      - `movie_title` (text)
      - `movie_url` (text)
      - `message` (text, optional)
      - `status` (text, 'pending', 'accepted', 'declined')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on movie_invitations table
    - Add policies for movie invitation management
*/

CREATE TABLE IF NOT EXISTS movie_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  movie_title text NOT NULL,
  movie_url text NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE movie_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for movie_invitations
CREATE POLICY "Users can view their movie invitations"
  ON movie_invitations
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send movie invitations"
  ON movie_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update invitation status"
  ON movie_invitations
  FOR UPDATE
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id);