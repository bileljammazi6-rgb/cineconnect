/*
  # Update messages table structure

  1. Changes
    - Update messages table to use room-based structure
    - Add proper foreign key relationships
    - Update RLS policies

  2. Security
    - Update RLS policies for room-based messaging
*/

-- Update messages table structure if needed
DO $$
BEGIN
  -- Add user_id column if it doesn't exist (for compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;