import { embed } from "ai"
import { google, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from "@/lib/ai/google"

export interface DocumentChunkResult {
  id: string
  document_id: string
  content: string
  metadata?: any
  similarity?: number
}

/**
 * Retrieve document chunks for a given query or query embedding using match_document_chunks RPC.
 */
export async function retrieveRelevantChunks(
  supabase: any,
  options: {
    workspaceId: string
    userId?: string
    query?: string
    matchCount?: number
  }
): Promise<DocumentChunkResult[]> {
  const { workspaceId, userId, query, matchCount = 8 } = options

  if (!query || query.trim().length === 0) {
    return []
  }

  try {
    // 1. Generate query embedding using the standard embedding model (3072 dims)
    const { embedding } = await embed({
      model: google.textEmbeddingModel(EMBEDDING_MODEL, {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
      value: query,
    })

    // 2. Perform similarity search via match_document_chunks RPC
    const { data: chunks, error: matchError } = await supabase.rpc(
      "match_document_chunks",
      {
        query_embedding: embedding,
        match_count: matchCount,
        filter_workspace_id: workspaceId,
        filter_user_id: userId || null,
      }
    )

    if (matchError) {
      console.error("[RAG Retriever] RPC match_document_chunks error:", matchError.message)
      return []
    }

    return (chunks as DocumentChunkResult[]) || []
  } catch (err) {
    console.error("[RAG Retriever] Error retrieving chunks:", err)
    return []
  }
}

/**
 * Get all document chunks belonging to a workspace, ordered by chunk_index.
 * Ideal for global tasks like Summary, Comprehensive Quizzes, and Flashcards
 * so that the entire structured document content is available to the model.
 */
export async function getAllWorkspaceChunks(
  supabase: any,
  workspaceId: string
): Promise<DocumentChunkResult[]> {
  try {
    const { data: chunks, error } = await supabase
      .from("document_chunks")
      .select("id, document_id, content, metadata")
      .eq("workspace_id", workspaceId)

    if (error || !chunks) {
      console.error("[RAG Retriever] Error fetching all workspace chunks:", error?.message)
      return []
    }

    // Sort in memory by metadata.chunk_index ascending to preserve document reading order
    const sorted = [...chunks].sort((a: any, b: any) => {
      const idxA = a.metadata?.chunk_index ?? 0
      const idxB = b.metadata?.chunk_index ?? 0
      return idxA - idxB
    })

    return sorted as DocumentChunkResult[]
  } catch (err) {
    console.error("[RAG Retriever] Error getting all workspace chunks:", err)
    return []
  }
}

/**
 * Helper to format retrieved chunks into standard prompt context.
 * Clearly specifies exact page numbers and instructs strict fidelity.
 */
export function formatChunksForPrompt(chunks: DocumentChunkResult[]): string {
  if (!chunks || chunks.length === 0) return ""

  return chunks
    .map((chunk, idx) => {
      const page = chunk.metadata?.page_number
      const pageLabel = page ? `Halaman ${page}` : `Bagian #${idx + 1}`
      return `[SUMBER DOKUMEN: ${pageLabel}]\n${chunk.content.trim()}`
    })
    .join("\n\n---\n\n")
}
