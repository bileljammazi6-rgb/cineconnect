/*
  # Create user locations table

  1. New Tables
    - `user_locations`
      - `user_id` (uuid, references users.id)
      - `latitude` (double precision)
      - `longitude` (double precision)
      - `city` (text, optional)
      - `country` (text, optional)
      - `is_visible` (boolean, default true)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_locations` table
    - Add policies for users to manage their own location data
    - Add policy for users to read visible locations of others
*/

CREATE TABLE IF NOT EXISTS user_locations (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  city text,
  country text,
  is_visible boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Users can manage their own location data
CREATE POLICY "Users can manage own location"
  ON user_locations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can read visible locations of others
CREATE POLICY "Users can read visible locations"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (is_visible = true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_visible ON user_locations(is_visible);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated ON user_locations(updated_at);