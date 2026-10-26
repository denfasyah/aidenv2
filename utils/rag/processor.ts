import { embedMany } from "ai"
import { google, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from "@/lib/ai/google"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse")

/**
 * Split text into overlapping chunks.
 * Tries to break on newlines/sentence boundaries for cleaner chunks.
 */
function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    let end = i + chunkSize
    // Try to snap to a sentence/newline boundary within ±100 chars
    if (end < text.length) {
      const boundary = text.lastIndexOf("\n", end)
      if (boundary > i + chunkSize - 100) end = boundary + 1
    }
    const chunk = text.slice(i, end).trim()
    if (chunk.length > 0) chunks.push(chunk)
    i = end - overlap
    if (i <= 0) i = end // prevent infinite loop on small texts
  }
  return chunks
}

/**
 * Process a single document: extract text → chunk → embed → store in Supabase.
 * Uses gemini-embedding-001 (3072 dims, verified active Oct 2026).
 * Embedding is batched in groups of 20 to stay within API limits.
 */
export async function processDocument(
  supabase: any,
  workspaceId: string,
  _userId: string,
  filePath: string,
  documentId: string
): Promise<{ success: boolean; error?: string; chunksIndexed?: number }> {
  try {
    // 1. Mark as processing
    await supabase
      .from("documents")
      .update({ status: "processing", error_message: null })
      .eq("id", documentId)

    // 2. Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("materials")
      .download(filePath)

    if (downloadError || !fileData) {
      throw new Error(`Storage download failed: ${downloadError?.message ?? "no data"}`)
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // 3. Extract text from PDF
    const pdfData = await pdfParse(buffer)
    const text: string = pdfData.text ?? ""

    if (!text || text.trim().length < 10) {
      throw new Error("PDF appears to have no extractable text (possibly scanned image-only PDF)")
    }

    // 4. Chunk text
    const rawChunks = chunkText(text, 1200, 200)
    const chunks = rawChunks.filter(c => c.trim().length > 30) // discard tiny noise chunks

    if (chunks.length === 0) {
      throw new Error("No meaningful text chunks could be extracted from the PDF")
    }

    // 5. Embed in batches of 20 (API rate limit safety)
    const BATCH_SIZE = 20
    const allEmbeddings: number[][] = []

    for (let b = 0; b < chunks.length; b += BATCH_SIZE) {
      const batch = chunks.slice(b, b + BATCH_SIZE)
      const { embeddings } = await embedMany({
        model: google.textEmbeddingModel(EMBEDDING_MODEL, {
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
        values: batch,
      })
      allEmbeddings.push(...embeddings)
    }

    // 6. Delete old chunks for this document (safe re-index)
    await supabase.from("document_chunks").delete().eq("document_id", documentId)

    // 7. Insert new chunks
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: documentId,
      workspace_id: workspaceId,
      content: chunk,
      embedding: allEmbeddings[index],
      metadata: {
        chunk_index: index,
        total_chunks: chunks.length,
        embedding_model: EMBEDDING_MODEL,
        embedding_dims: EMBEDDING_DIMENSIONS,
      },
    }))

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(chunkRecords)

    if (insertError) {
      throw new Error(`Failed to store chunks: ${insertError.message}`)
    }

    // 8. Mark as completed
    await supabase
      .from("documents")
      .update({ status: "completed", error_message: null })
      .eq("id", documentId)

    return { success: true, chunksIndexed: chunks.length }
  } catch (error: any) {
    console.error("[RAG Processor] Error:", error)
    await supabase
      .from("documents")
      .update({
        status: "failed",
        error_message: (error.message ?? "Unknown error").slice(0, 500),
      })
      .eq("id", documentId)
    return { success: false, error: error.message }
  }
}
