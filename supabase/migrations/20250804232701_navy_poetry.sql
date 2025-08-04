/*
  # Create User Locations System

  1. New Tables
    - `user_locations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `latitude` (double precision)
      - `longitude` (double precision)
      - `city` (text, optional)
      - `country` (text, optional)
      - `is_visible` (boolean, default true)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on user_locations table
    - Add policies for location sharing
*/

CREATE TABLE IF NOT EXISTS user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  city text,
  country text,
  is_visible boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_locations
CREATE POLICY "Visible locations are viewable by everyone"
  ON user_locations
  FOR SELECT
  USING (is_visible = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own location"
  ON user_locations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update trigger for user_locations
CREATE TRIGGER update_user_locations_updated_at
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();