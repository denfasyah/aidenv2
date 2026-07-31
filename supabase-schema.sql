-- Drop existing tables to allow clean re-run
drop table if exists activity_logs cascade;
drop table if exists notifications cascade;
drop table if exists notes cascade;
drop table if exists messages cascade;
drop table if exists chats cascade;
drop table if exists summaries cascade;
drop table if exists quizzes cascade;
drop table if exists flashcards cascade;
drop table if exists workspaces cascade;
drop table if exists users cascade; -- Formerly profiles

-- 1. USERS (Extends auth.users in public schema)
create table users (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. WORKSPACES
create table workspaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. FLASHCARDS
create table flashcards (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. QUIZZES
create table quizzes (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SUMMARIES
create table summaries (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. NOTES (Personal user notes inside workspaces)
create table notes (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. CHATS (Assistant)
create table chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  workspace_id uuid references workspaces(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. MESSAGES
create table messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. NOTIFICATIONS (System or Admin broadcasts)
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  message text not null,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. ACTIVITY LOGS (Centralized History)
create table activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  workspace_id uuid references workspaces(id) on delete cascade,
  action_type text not null, 
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table users enable row level security;
alter table workspaces enable row level security;
alter table flashcards enable row level security;
alter table quizzes enable row level security;
alter table summaries enable row level security;
alter table notes enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;

-- Create Policies (For Normal Users)
create policy "Users can view own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

create policy "Users can view own workspaces" on workspaces for select using (auth.uid() = user_id);
create policy "Users can insert own workspaces" on workspaces for insert with check (auth.uid() = user_id);
create policy "Users can update own workspaces" on workspaces for update using (auth.uid() = user_id);
create policy "Users can delete own workspaces" on workspaces for delete using (auth.uid() = user_id);

create policy "Users can CRUD own flashcards" on flashcards for all using (auth.uid() = user_id);
create policy "Users can CRUD own quizzes" on quizzes for all using (auth.uid() = user_id);
create policy "Users can CRUD own summaries" on summaries for all using (auth.uid() = user_id);
create policy "Users can CRUD own notes" on notes for all using (auth.uid() = user_id);

create policy "Users can view own chats" on chats for select using (auth.uid() = user_id);
create policy "Users can insert own chats" on chats for insert with check (auth.uid() = user_id);
create policy "Users can delete own chats" on chats for delete using (auth.uid() = user_id);

create policy "Users can view messages of their chats" on messages for select using (
  exists (select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid())
);
create policy "Users can insert messages to their chats" on messages for insert with check (
  exists (select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid())
);

create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can insert own notifications" on notifications for insert with check (auth.uid() = user_id);
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);
create policy "Users can delete own notifications" on notifications for delete using (auth.uid() = user_id);

create policy "Users can view own activity logs" on activity_logs for select using (auth.uid() = user_id);
create policy "Users can insert own activity logs" on activity_logs for insert with check (auth.uid() = user_id);
