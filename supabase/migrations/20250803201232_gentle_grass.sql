/*
  # Create quotes table for user-generated quotes

  1. New Tables
    - `quotes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `content` (text, the quote content)
      - `author` (text, quote author)
      - `category` (text, quote category)
      - `likes` (integer, like count)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `quotes` table
    - Add policies for CRUD operations
    - Users can read all quotes
    - Users can create quotes
    - Users can update/delete their own quotes

  3. Functions
    - Function to increment quote likes
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  author text DEFAULT 'Anonymous',
  category text DEFAULT 'general',
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Users can read all quotes
CREATE POLICY "Users can read all quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can create quotes
CREATE POLICY "Users can create quotes"
  ON quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own quotes
CREATE POLICY "Users can update own quotes"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own quotes
CREATE POLICY "Users can delete own quotes"
  ON quotes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to increment quote likes
CREATE OR REPLACE FUNCTION increment_quote_likes(quote_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE quotes 
  SET likes = likes + 1 
  WHERE id = quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_category ON quotes(category);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_likes ON quotes(likes);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();