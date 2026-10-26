-- ============================================================
-- RAG MIGRATION: Non-destructive (safe for existing data)
-- Run this in Supabase SQL Editor > New Query
-- Date: 2026-10-09
-- ============================================================
-- 
-- IMPORTANT: This migration does NOT drop any existing tables.
-- It only ADDS new tables/columns if they don't exist.
--
-- PREREQUISITE: Enable pgvector extension first (once per database):
--   CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
-- ============================================================

-- 0. Enable pgvector (safe: uses IF NOT EXISTS)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 1. Create documents table (tracks uploaded PDFs & indexing status)
CREATE TABLE IF NOT EXISTS documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Create document_chunks table (stores text chunks + vector embeddings)
--    Uses gemini-embedding-001 output: 3072 dimensions (Matryoshka default)
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  embedding extensions.vector(3072),
  metadata jsonb,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. HNSW index for fast approximate nearest-neighbor cosine search
--    (Only create if doesn't exist — DROP + recreate if you need to change dims)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops);

-- 4. Enable Row Level Security (safe if already enabled)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for documents (drop only if exists, then recreate)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own documents" ON documents;
  DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
  DROP POLICY IF EXISTS "Users can update own documents" ON documents;
  DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
END $$;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE USING (auth.uid() = user_id);

-- 6. RLS Policies for document_chunks
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own document_chunks" ON document_chunks;
  DROP POLICY IF EXISTS "Users can insert own document_chunks" ON document_chunks;
  DROP POLICY IF EXISTS "Users can update own document_chunks" ON document_chunks;
  DROP POLICY IF EXISTS "Users can delete own document_chunks" ON document_chunks;
END $$;

CREATE POLICY "Users can view own document_chunks"
  ON document_chunks FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
        AND documents.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own document_chunks"
  ON document_chunks FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
        AND documents.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own document_chunks"
  ON document_chunks FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
        AND documents.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own document_chunks"
  ON document_chunks FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
        AND documents.user_id = auth.uid()
    )
  );

-- 7. Drop old RPC function if exists, then recreate with 3072 dims + user filter
DROP FUNCTION IF EXISTS match_document_chunks(extensions.vector, int, uuid);
DROP FUNCTION IF EXISTS match_document_chunks(extensions.vector, int, uuid, uuid);

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding extensions.vector(3072),
  match_count      int DEFAULT 5,
  filter_workspace_id uuid DEFAULT NULL,
  filter_user_id   uuid DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  document_id uuid,
  content     text,
  metadata    jsonb,
  similarity  float
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE
    -- Workspace isolation
    (filter_workspace_id IS NULL OR dc.workspace_id = filter_workspace_id)
    -- User isolation (belt + suspenders with RLS)
    AND (filter_user_id IS NULL OR d.user_id = filter_user_id)
    -- Only include chunks from completed documents
    AND d.status = 'completed'
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
