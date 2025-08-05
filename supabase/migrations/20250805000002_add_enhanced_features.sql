
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  image_url text,
  hashtags text[],
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

create table public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.user_follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.users(id) on delete cascade not null,
  following_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

create table public.movie_ratings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  movie_id text not null,
  movie_title text not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  review text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, movie_id)
);

create table public.movie_watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  movie_id text not null,
  movie_title text not null,
  movie_poster text,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, movie_id)
);

create table public.game_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  game_type text not null,
  score integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.message_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id, emoji)
);

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.user_follows enable row level security;
alter table public.movie_ratings enable row level security;
alter table public.movie_watchlist enable row level security;
alter table public.game_scores enable row level security;
alter table public.message_reactions enable row level security;

create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Users can create posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update their own posts" on posts for update using (auth.uid() = user_id);
create policy "Users can delete their own posts" on posts for delete using (auth.uid() = user_id);

create policy "Post likes are viewable by everyone" on post_likes for select using (true);
create policy "Users can like posts" on post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts" on post_likes for delete using (auth.uid() = user_id);

create policy "Post comments are viewable by everyone" on post_comments for select using (true);
create policy "Users can comment on posts" on post_comments for insert with check (auth.uid() = user_id);
create policy "Users can update their own comments" on post_comments for update using (auth.uid() = user_id);
create policy "Users can delete their own comments" on post_comments for delete using (auth.uid() = user_id);

create policy "User follows are viewable by everyone" on user_follows for select using (true);
create policy "Users can follow others" on user_follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow others" on user_follows for delete using (auth.uid() = follower_id);

create policy "Movie ratings are viewable by everyone" on movie_ratings for select using (true);
create policy "Users can rate movies" on movie_ratings for insert with check (auth.uid() = user_id);
create policy "Users can update their own ratings" on movie_ratings for update using (auth.uid() = user_id);
create policy "Users can delete their own ratings" on movie_ratings for delete using (auth.uid() = user_id);

create policy "Users can view their own watchlist" on movie_watchlist for select using (auth.uid() = user_id);
create policy "Users can add to their watchlist" on movie_watchlist for insert with check (auth.uid() = user_id);
create policy "Users can remove from their watchlist" on movie_watchlist for delete using (auth.uid() = user_id);

create policy "Game scores are viewable by everyone" on game_scores for select using (true);
create policy "Users can submit their own scores" on game_scores for insert with check (auth.uid() = user_id);

create policy "Message reactions are viewable by everyone" on message_reactions for select using (true);
create policy "Users can react to messages" on message_reactions for insert with check (auth.uid() = user_id);
create policy "Users can remove their reactions" on message_reactions for delete using (auth.uid() = user_id);

create or replace function update_post_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update posts set likes_count = likes_count - 1 where id = OLD.post_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

create or replace function update_post_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = NEW.post_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update posts set comments_count = comments_count - 1 where id = OLD.post_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger update_post_likes_count_trigger
  after insert or delete on post_likes
  for each row execute function update_post_likes_count();

create trigger update_post_comments_count_trigger
  after insert or delete on post_comments
  for each row execute function update_post_comments_count();
