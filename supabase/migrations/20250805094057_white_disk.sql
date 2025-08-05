/*
  # Complete Schema Fix for Entertainment Hub

  1. Clean up and recreate all tables with proper structure
  2. Add all necessary functions and triggers
  3. Set up proper RLS policies
  4. Ensure compatibility with application code
*/

-- Drop existing tables and functions to start fresh
DROP TABLE IF EXISTS event_attendees CASCADE;
DROP TABLE IF EXISTS location_events CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS game_scores CASCADE;
DROP TABLE IF EXISTS movie_watchlist CASCADE;
DROP TABLE IF EXISTS movie_ratings CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS movie_invitations CASCADE;
DROP TABLE IF EXISTS tic_tac_toe_games CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS user_locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_post_likes_count() CASCADE;
DROP FUNCTION IF EXISTS update_post_comments_count() CASCADE;
DROP FUNCTION IF EXISTS increment_quote_likes(uuid) CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  website text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Create user_locations table
CREATE TABLE user_locations (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  city text,
  country text,
  is_visible boolean DEFAULT true,
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own location" ON user_locations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read visible locations" ON user_locations FOR SELECT TO authenticated USING (is_visible = true);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  metadata jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON messages FOR SELECT TO public USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));
CREATE POLICY "Users can send messages" ON messages FOR INSERT TO public WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can delete their own sent messages" ON messages FOR DELETE TO public USING (auth.uid() = sender_id);

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('message', 'game', 'quote', 'location', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  data jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT TO public WITH CHECK (true);

-- Create quotes table
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  author text DEFAULT 'Anonymous',
  category text DEFAULT 'general',
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all quotes" ON quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create quotes" ON quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotes" ON quotes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotes" ON quotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create tic_tac_toe_games table
CREATE TABLE tic_tac_toe_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_x uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_o uuid REFERENCES users(id) ON DELETE CASCADE,
  board jsonb DEFAULT '[]'::jsonb,
  current_player text DEFAULT 'X' CHECK (current_player IN ('X', 'O')),
  winner text CHECK (winner IN ('X', 'O', 'draw')),
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE tic_tac_toe_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read relevant games" ON tic_tac_toe_games FOR SELECT TO authenticated USING ((auth.uid() = player_x) OR (auth.uid() = player_o) OR (status = 'waiting'));
CREATE POLICY "Users can create games" ON tic_tac_toe_games FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_x);
CREATE POLICY "Players can update their games" ON tic_tac_toe_games FOR UPDATE TO authenticated USING ((auth.uid() = player_x) OR (auth.uid() = player_o) OR ((status = 'waiting') AND (player_o IS NULL))) WITH CHECK ((auth.uid() = player_x) OR (auth.uid() = player_o) OR ((status = 'waiting') AND (player_o IS NULL)));

-- Create movie_invitations table
CREATE TABLE movie_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  movie_title text NOT NULL,
  movie_url text NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE movie_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their movie invitations" ON movie_invitations FOR SELECT TO public USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));
CREATE POLICY "Users can send movie invitations" ON movie_invitations FOR INSERT TO public WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update invitation status" ON movie_invitations FOR UPDATE TO public USING ((auth.uid() = recipient_id) OR (auth.uid() = sender_id));

-- Create posts table
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  hashtags text[],
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT TO public USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE TO public USING (auth.uid() = user_id);

-- Create post_likes table
CREATE TABLE post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes are viewable by everyone" ON post_likes FOR SELECT TO public USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE TO public USING (auth.uid() = user_id);

-- Create post_comments table
CREATE TABLE post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post comments are viewable by everyone" ON post_comments FOR SELECT TO public USING (true);
CREATE POLICY "Users can comment on posts" ON post_comments FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON post_comments FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON post_comments FOR DELETE TO public USING (auth.uid() = user_id);

-- Create user_follows table
CREATE TABLE user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User follows are viewable by everyone" ON user_follows FOR SELECT TO public USING (true);
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT TO public WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON user_follows FOR DELETE TO public USING (auth.uid() = follower_id);

-- Create movie_ratings table
CREATE TABLE movie_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id text NOT NULL,
  movie_title text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

ALTER TABLE movie_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movie ratings are viewable by everyone" ON movie_ratings FOR SELECT TO public USING (true);
CREATE POLICY "Users can rate movies" ON movie_ratings FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON movie_ratings FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON movie_ratings FOR DELETE TO public USING (auth.uid() = user_id);

-- Create movie_watchlist table
CREATE TABLE movie_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id text NOT NULL,
  movie_title text NOT NULL,
  movie_poster text,
  added_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

ALTER TABLE movie_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist" ON movie_watchlist FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their watchlist" ON movie_watchlist FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their watchlist" ON movie_watchlist FOR DELETE TO public USING (auth.uid() = user_id);

-- Create game_scores table
CREATE TABLE game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type text NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game scores are viewable by everyone" ON game_scores FOR SELECT TO public USING (true);
CREATE POLICY "Users can submit their own scores" ON game_scores FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

-- Create message_reactions table
CREATE TABLE message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Message reactions are viewable by everyone" ON message_reactions FOR SELECT TO public USING (true);
CREATE POLICY "Users can react to messages" ON message_reactions FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their reactions" ON message_reactions FOR DELETE TO public USING (auth.uid() = user_id);

-- Create location_events table
CREATE TABLE location_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'movie_meetup',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  event_date timestamptz NOT NULL,
  max_attendees integer,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE location_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Location events are viewable by everyone" ON location_events FOR SELECT TO public USING (true);
CREATE POLICY "Users can create events" ON location_events FOR INSERT TO public WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own events" ON location_events FOR UPDATE TO public USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own events" ON location_events FOR DELETE TO public USING (auth.uid() = creator_id);

-- Create event_attendees table
CREATE TABLE event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES location_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
  joined_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event attendees are viewable by everyone" ON event_attendees FOR SELECT TO public USING (true);
CREATE POLICY "Users can join events" ON event_attendees FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their attendance" ON event_attendees FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can leave events" ON event_attendees FOR DELETE TO public USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_user_locations_updated ON user_locations(updated_at);
CREATE INDEX idx_user_locations_visible ON user_locations(is_visible);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_quotes_category ON quotes(category);
CREATE INDEX idx_quotes_likes ON quotes(likes);

CREATE INDEX idx_tic_tac_toe_games_player_x ON tic_tac_toe_games(player_x);
CREATE INDEX idx_tic_tac_toe_games_player_o ON tic_tac_toe_games(player_o);
CREATE INDEX idx_tic_tac_toe_games_status ON tic_tac_toe_games(status);
CREATE INDEX idx_tic_tac_toe_games_created_at ON tic_tac_toe_games(created_at);

CREATE INDEX idx_movie_invitations_sender_id ON movie_invitations(sender_id);
CREATE INDEX idx_movie_invitations_recipient_id ON movie_invitations(recipient_id);
CREATE INDEX idx_movie_invitations_status ON movie_invitations(status);
CREATE INDEX idx_movie_invitations_created_at ON movie_invitations(created_at);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_hashtags ON posts USING gin(hashtags);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);

CREATE INDEX idx_movie_ratings_user_id ON movie_ratings(user_id);
CREATE INDEX idx_movie_ratings_movie_id ON movie_ratings(movie_id);
CREATE INDEX idx_movie_ratings_rating ON movie_ratings(rating);

CREATE INDEX idx_movie_watchlist_user_id ON movie_watchlist(user_id);
CREATE INDEX idx_movie_watchlist_movie_id ON movie_watchlist(movie_id);

CREATE INDEX idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX idx_game_scores_game_type ON game_scores(game_type);
CREATE INDEX idx_game_scores_score ON game_scores(score);

CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

CREATE INDEX idx_location_events_creator_id ON location_events(creator_id);
CREATE INDEX idx_location_events_event_date ON location_events(event_date);
CREATE INDEX idx_location_events_event_type ON location_events(event_type);

CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION increment_quote_likes(quote_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE quotes SET likes = likes + 1 WHERE id = quote_id;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at_trigger
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_quotes_updated_at();

CREATE TRIGGER update_tic_tac_toe_games_updated_at
  BEFORE UPDATE ON tic_tac_toe_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();