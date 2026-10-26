-- Drop existing tables to allow clean re-run
drop table if exists activity_logs cascade;
drop table if exists notifications cascade;
drop table if exists notes cascade;
drop table if exists messages cascade;
drop table if exists chats cascade;
drop table if exists summaries cascade;
drop table if exists quizzes cascade;
drop table if exists flashcards cascade;
drop table if exists document_chunks cascade;
drop table if exists documents cascade;
drop table if exists workspaces cascade;
drop table if exists users cascade; -- Formerly profiles

-- Enable pgvector
create extension if not exists vector with schema extensions;

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

-- 2b. DOCUMENTS
create table documents (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  storage_path text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2c. DOCUMENT_CHUNKS
create table document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade not null,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  content text not null,
  embedding vector(768),
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for similarity search
create index on document_chunks using hnsw (embedding vector_cosine_ops);

-- Similarity search RPC
create or replace function match_document_chunks (
  query_embedding vector(768),
  match_count int default 10,
  filter_workspace_id uuid default null
) returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where filter_workspace_id is null or document_chunks.workspace_id = filter_workspace_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

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
alter table documents enable row level security;
alter table document_chunks enable row level security;
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

create policy "Users can view own documents" on documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents" on documents for insert with check (auth.uid() = user_id);
create policy "Users can update own documents" on documents for update using (auth.uid() = user_id);
create policy "Users can delete own documents" on documents for delete using (auth.uid() = user_id);

create policy "Users can view own document_chunks" on document_chunks for select using (
  exists (select 1 from documents where documents.id = document_chunks.document_id and documents.user_id = auth.uid())
);
create policy "Users can insert own document_chunks" on document_chunks for insert with check (
  exists (select 1 from documents where documents.id = document_chunks.document_id and documents.user_id = auth.uid())
);
create policy "Users can update own document_chunks" on document_chunks for update using (
  exists (select 1 from documents where documents.id = document_chunks.document_id and documents.user_id = auth.uid())
);
create policy "Users can delete own document_chunks" on document_chunks for delete using (
  exists (select 1 from documents where documents.id = document_chunks.document_id and documents.user_id = auth.uid())
);

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
