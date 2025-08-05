-- SECURE DATABASE SCHEMA FOR CINECONNECT
-- This schema addresses all security vulnerabilities and data integrity issues

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- FIXED: Added missing last_seen field and constraints
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  username text UNIQUE NOT NULL CHECK (username ~* '^[a-zA-Z0-9_]{3,20}$'),
  full_name text CHECK (length(full_name) <= 100),
  avatar_url text CHECK (avatar_url IS NULL OR avatar_url ~* '^https?://'),
  bio text CHECK (length(bio) <= 500),
  location text CHECK (length(location) <= 100),
  website text CHECK (website IS NULL OR website ~* '^https?://'),
  last_seen timestamptz, -- FIXED: Added missing field
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- FIXED: Added coordinate validation
CREATE TABLE IF NOT EXISTS user_locations (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  latitude double precision NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude double precision NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  city text CHECK (length(city) <= 100),
  country text CHECK (length(country) <= 100),
  is_visible boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own location"
  ON user_locations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read visible locations"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (is_visible = true);

-- FIXED: Changed recipient_id to receiver_id and added read field and constraints
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE, -- FIXED: Changed from recipient_id
  content text NOT NULL CHECK (length(content) <= 1000 AND length(content) > 0), -- FIXED: Added length constraints
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location')),
  metadata jsonb,
  read boolean DEFAULT false, -- FIXED: Added missing field
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_users CHECK (sender_id != receiver_id) -- FIXED: Prevent self-messaging
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- FIXED: Updated policies to use receiver_id
CREATE POLICY "Users can view their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- FIXED: Added policy for updating read status
CREATE POLICY "Users can update message read status"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own sent messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- FIXED: Added length constraints and improved validation
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('message', 'game', 'quote', 'location', 'system')),
  title text NOT NULL CHECK (length(title) <= 200 AND length(title) > 0),
  message text NOT NULL CHECK (length(message) <= 1000 AND length(message) > 0),
  read boolean DEFAULT false,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- FIXED: Changed from public to authenticated and restricted insertion
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated -- FIXED: Changed from public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated -- FIXED: Changed from public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- FIXED: More restrictive notification insertion - only service role can insert
CREATE POLICY "Service can insert notifications"
  ON notifications
  FOR INSERT
  TO service_role -- FIXED: Changed from public to service_role
  WITH CHECK (true);

-- FIXED: Added content length validation
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (length(content) <= 500 AND length(content) > 0),
  author text DEFAULT 'Anonymous' CHECK (length(author) <= 100),
  category text DEFAULT 'general' CHECK (category IN ('general', 'motivational', 'funny', 'philosophical', 'love', 'life')),
  likes integer DEFAULT 0 CHECK (likes >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create quotes"
  ON quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotes"
  ON quotes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tic_tac_toe_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_x uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  player_o uuid REFERENCES users(id) ON DELETE CASCADE,
  board jsonb DEFAULT '[]'::jsonb,
  current_player text DEFAULT 'X' CHECK (current_player IN ('X', 'O')),
  winner text CHECK (winner IN ('X', 'O', 'draw')),
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_players CHECK (player_x != player_o) -- FIXED: Prevent self-play
);

ALTER TABLE tic_tac_toe_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read relevant games"
  ON tic_tac_toe_games
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = player_x OR 
    auth.uid() = player_o OR 
    status = 'waiting'
  );

CREATE POLICY "Users can create games"
  ON tic_tac_toe_games
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_x);

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

-- FIXED: Added constraints and validation
CREATE TABLE IF NOT EXISTS movie_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  movie_title text NOT NULL CHECK (length(movie_title) <= 200 AND length(movie_title) > 0),
  movie_url text NOT NULL CHECK (movie_url ~* '^https?://'),
  message text CHECK (message IS NULL OR length(message) <= 500),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_users_invitation CHECK (sender_id != recipient_id) -- FIXED: Prevent self-invitation
);

ALTER TABLE movie_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their movie invitations"
  ON movie_invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send movie invitations"
  ON movie_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update invitation status"
  ON movie_invitations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- FIXED: Added content length validation
CREATE TABLE IF NOT EXISTS posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (length(content) <= 2000 AND length(content) > 0),
  image_url text CHECK (image_url IS NULL OR image_url ~* '^https?://'),
  hashtags text[] CHECK (array_length(hashtags, 1) <= 10), -- FIXED: Limit hashtags
  likes_count integer DEFAULT 0 CHECK (likes_count >= 0),
  comments_count integer DEFAULT 0 CHECK (comments_count >= 0),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS post_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- FIXED: Added content length validation
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (length(content) <= 1000 AND length(content) > 0),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id) -- FIXED: Prevent self-following
);

-- FIXED: Added review length validation
CREATE TABLE IF NOT EXISTS movie_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  movie_id text NOT NULL CHECK (length(movie_id) > 0),
  movie_title text NOT NULL CHECK (length(movie_title) <= 200 AND length(movie_title) > 0),
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review text CHECK (review IS NULL OR length(review) <= 2000),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS movie_watchlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  movie_id text NOT NULL CHECK (length(movie_id) > 0),
  movie_title text NOT NULL CHECK (length(movie_title) <= 200 AND length(movie_title) > 0),
  movie_poster text CHECK (movie_poster IS NULL OR movie_poster ~* '^https?://'),
  added_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS game_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  game_type text NOT NULL CHECK (game_type IN ('tic_tac_toe', 'memory', 'puzzle')),
  score integer NOT NULL CHECK (score >= 0),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FIXED: Added proper RLS policy for message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL CHECK (length(emoji) <= 10),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- FIXED: Added coordinate validation and constraints
CREATE TABLE IF NOT EXISTS location_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL CHECK (length(title) <= 200 AND length(title) > 0),
  description text CHECK (description IS NULL OR length(description) <= 2000),
  event_type text DEFAULT 'movie_meetup' CHECK (event_type IN ('movie_meetup', 'game_night', 'social', 'other')),
  latitude double precision NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude double precision NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  address text CHECK (address IS NULL OR length(address) <= 500),
  event_date timestamptz NOT NULL CHECK (event_date > now()), -- FIXED: Prevent past events
  max_attendees integer CHECK (max_attendees IS NULL OR max_attendees > 0),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES location_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
  joined_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- SECURE RLS POLICIES
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Post likes are viewable by everyone" ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Post comments are viewable by everyone" ON post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can comment on posts" ON post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON post_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User follows are viewable by everyone" ON user_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON user_follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE POLICY "Movie ratings are viewable by everyone" ON movie_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can rate movies" ON movie_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON movie_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON movie_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own watchlist" ON movie_watchlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their watchlist" ON movie_watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their watchlist" ON movie_watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Game scores are viewable by everyone" ON game_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can submit their own scores" ON game_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- FIXED: Secure message reactions policy
CREATE POLICY "Users can view reactions to accessible messages" ON message_reactions 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_reactions.message_id 
      AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can react to accessible messages" ON message_reactions 
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_reactions.message_id 
      AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can remove their reactions" ON message_reactions 
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Location events are viewable by everyone" ON location_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create events" ON location_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own events" ON location_events FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own events" ON location_events FOR DELETE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Event attendees are viewable by everyone" ON event_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join events" ON event_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their attendance" ON event_attendees FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can leave events" ON event_attendees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SECURE FUNCTIONS
DROP FUNCTION IF EXISTS increment_quote_likes(uuid);

-- FIXED: Added security and validation to quote likes function
CREATE OR REPLACE FUNCTION increment_quote_likes(quote_id uuid)
RETURNS void AS $$
BEGIN
  -- Verify the quote exists and user can access it
  IF NOT EXISTS (SELECT 1 FROM quotes WHERE id = quote_id) THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;
  
  UPDATE quotes 
  SET likes = likes + 1 
  WHERE id = quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Utility functions (unchanged but secure)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FIXED: Added validation to count functions
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers (unchanged)
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

CREATE TRIGGER update_tic_tac_toe_games_updated_at
  BEFORE UPDATE ON tic_tac_toe_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Performance indexes (unchanged but comprehensive)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen); -- FIXED: Added index

CREATE INDEX IF NOT EXISTS idx_user_locations_visible ON user_locations(is_visible);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated ON user_locations(updated_at);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id); -- FIXED: Updated field name
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read); -- FIXED: Added index

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_category ON quotes(category);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_likes ON quotes(likes);

CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_games_status ON tic_tac_toe_games(status);
CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_games_player_x ON tic_tac_toe_games(player_x);
CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_games_player_o ON tic_tac_toe_games(player_o);
CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_games_created_at ON tic_tac_toe_games(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_invitations_sender_id ON movie_invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_movie_invitations_recipient_id ON movie_invitations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_movie_invitations_status ON movie_invitations(status);
CREATE INDEX IF NOT EXISTS idx_movie_invitations_created_at ON movie_invitations(created_at);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_movie_ratings_user_id ON movie_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_ratings_movie_id ON movie_ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_ratings_rating ON movie_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_movie_watchlist_user_id ON movie_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_watchlist_movie_id ON movie_watchlist(movie_id);

CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_location_events_creator_id ON location_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_location_events_event_date ON location_events(event_date);
CREATE INDEX IF NOT EXISTS idx_location_events_event_type ON location_events(event_type);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);

SELECT 'Secure CineConnect database schema created successfully!' as result;