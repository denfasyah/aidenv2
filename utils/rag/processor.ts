import { embedMany } from "ai"
import { google, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from "@/lib/ai/google"

// Support both pdf-parse v2 (class PDFParse) and v1 (function)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require("pdf-parse")

interface ExtractedPage {
  pageNumber: number
  text: string
}

async function extractPagesFromPdf(buffer: Buffer): Promise<{ pages: ExtractedPage[]; fullText: string }> {
  // If pdf-parse v2+ with PDFParse class
  if (pdfParseModule && typeof pdfParseModule.PDFParse === "function") {
    const parser = new pdfParseModule.PDFParse({ data: buffer })
    try {
      const textResult = await parser.getText()
      if (textResult && Array.isArray(textResult.pages) && textResult.pages.length > 0) {
        const pages: ExtractedPage[] = textResult.pages.map((p: any) => ({
          pageNumber: p.num ?? 1,
          text: p.text ?? "",
        }))
        const fullText = textResult.text || pages.map(p => p.text).join("\n\n")
        return { pages, fullText }
      }
      return { pages: [{ pageNumber: 1, text: textResult?.text ?? "" }], fullText: textResult?.text ?? "" }
    } finally {
      if (typeof parser.destroy === "function") {
        await parser.destroy().catch(() => {})
      }
    }
  }

  // Fallback for function-based pdf-parse
  if (typeof pdfParseModule === "function") {
    const pdfData = await pdfParseModule(buffer)
    const fullText: string = pdfData.text ?? ""
    return { pages: [{ pageNumber: 1, text: fullText }], fullText }
  }

  throw new Error("Pustaka pdf-parse tidak dapat diinisialisasi.")
}

interface ChunkItem {
  content: string
  pageNumber: number
  totalChunksOnPage: number
  chunkIndexOnPage: number
}

/**
 * Split text of each page into overlapping chunks, strictly tagged with the exact pageNumber.
 */
function chunkPages(pages: ExtractedPage[], chunkSize = 1000, overlap = 150): ChunkItem[] {
  const allChunks: ChunkItem[] = []

  for (const page of pages) {
    const pageText = page.text.trim()
    if (!pageText || pageText.length < 15) continue

    const pageChunks: string[] = []
    let i = 0

    while (i < pageText.length) {
      let end = i + chunkSize
      // Snap to a newline or sentence boundary if possible
      if (end < pageText.length) {
        const boundary = pageText.lastIndexOf("\n", end)
        if (boundary > i + chunkSize - 120) end = boundary + 1
      }
      const slice = pageText.slice(i, end).trim()
      if (slice.length > 0) pageChunks.push(slice)
      i = end - overlap
      if (i <= 0) i = end
    }

    const filtered = pageChunks.filter(c => c.trim().length > 25)
    filtered.forEach((content, idx) => {
      allChunks.push({
        content,
        pageNumber: page.pageNumber,
        totalChunksOnPage: filtered.length,
        chunkIndexOnPage: idx + 1,
      })
    })
  }

  return allChunks
}

/**
 * Process a single document: extract text page-by-page → chunk with page tags → embed → store in Supabase.
 * Uses gemini-embedding-001 (3072 dims).
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

    // 3. Extract text per page
    const { pages, fullText } = await extractPagesFromPdf(buffer)

    if (!fullText || fullText.trim().length < 10) {
      throw new Error("PDF appears to have no extractable text (possibly scanned image-only PDF)")
    }

    // 4. Chunk text page-by-page
    const chunkItems = chunkPages(pages, 1000, 150)

    if (chunkItems.length === 0) {
      throw new Error("No meaningful text chunks could be extracted from the PDF")
    }

    // 5. Embed in batches of 20 (API rate limit safety)
    const BATCH_SIZE = 20
    const allEmbeddings: number[][] = []

    for (let b = 0; b < chunkItems.length; b += BATCH_SIZE) {
      const batch = chunkItems.slice(b, b + BATCH_SIZE).map(c => c.content)
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

    // 7. Insert new chunks with accurate page number metadata
    const chunkRecords = chunkItems.map((item, index) => ({
      document_id: documentId,
      workspace_id: workspaceId,
      content: item.content,
      embedding: allEmbeddings[index],
      metadata: {
        page_number: item.pageNumber,
        chunk_index: index,
        total_chunks: chunkItems.length,
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

    return { success: true, chunksIndexed: chunkItems.length }
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
