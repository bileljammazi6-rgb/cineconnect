
alter table public.messages 
drop constraint if exists messages_sender_id_fkey,
drop constraint if exists messages_recipient_id_fkey;

alter table public.messages 
add constraint messages_sender_id_fkey foreign key (sender_id) references public.users(id) on delete cascade,
add constraint messages_recipient_id_fkey foreign key (recipient_id) references public.users(id) on delete cascade;

alter table public.user_locations 
drop constraint if exists user_locations_user_id_fkey;

alter table public.user_locations 
add constraint user_locations_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.quotes 
drop constraint if exists quotes_user_id_fkey;

alter table public.quotes 
add constraint quotes_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.tic_tac_toe_games 
drop constraint if exists tic_tac_toe_games_player1_id_fkey,
drop constraint if exists tic_tac_toe_games_player2_id_fkey;

alter table public.tic_tac_toe_games 
add constraint tic_tac_toe_games_player1_id_fkey foreign key (player1_id) references public.users(id) on delete cascade,
add constraint tic_tac_toe_games_player2_id_fkey foreign key (player2_id) references public.users(id) on delete cascade;

alter table public.notifications 
drop constraint if exists notifications_user_id_fkey;

alter table public.notifications 
add constraint notifications_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

alter table public.movie_invitations 
drop constraint if exists movie_invitations_sender_id_fkey,
drop constraint if exists movie_invitations_recipient_id_fkey;

alter table public.movie_invitations 
add constraint movie_invitations_sender_id_fkey foreign key (sender_id) references public.users(id) on delete cascade,
add constraint movie_invitations_recipient_id_fkey foreign key (recipient_id) references public.users(id) on delete cascade;
