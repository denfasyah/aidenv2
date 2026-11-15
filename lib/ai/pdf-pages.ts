import { downloadPdfBuffer } from "@/lib/ai/pdf"

// Support both pdf-parse v2 (class PDFParse) and v1 (function)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require("pdf-parse")

export interface ExtractedPage {
  pageNumber: number
  text: string
}

export interface ExtractedPdfDocument {
  pages: ExtractedPage[]
  fullText: string
  pageCount: number
}

// In-memory cache for parsed PDF text per URL to avoid re-downloading & re-parsing on every chat message
const pdfCache = new Map<string, { doc: ExtractedPdfDocument; cachedAt: number }>()
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutes

/**
 * Common typo dictionary for technical terms and acronyms to make keyword search robust.
 */
const ACRONYM_TYPOS: Record<string, string> = {
  obdc: "odbc",
  umll: "uml",
  rdbs: "rdbms",
  sqll: "sql",
  erdd: "erd",
  dfdd: "dfd",
  guil: "gui",
}

function normalizeTypos(str: string): string {
  return str
    .split(/\s+/)
    .map((w) => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "")
      const mapped = ACRONYM_TYPOS[clean]
      return mapped ? `${w} ${mapped}` : w
    })
    .join(" ")
}

/**
 * Extracts all text page-by-page from a PDF buffer.
 */
export async function extractPagesFromBuffer(buffer: Buffer): Promise<ExtractedPdfDocument> {
  // If pdf-parse v2+ with PDFParse class
  if (pdfParseModule && typeof pdfParseModule.PDFParse === "function") {
    const parser = new pdfParseModule.PDFParse({ data: buffer })
    try {
      const textResult = await parser.getText()
      if (textResult && Array.isArray(textResult.pages) && textResult.pages.length > 0) {
        const pages: ExtractedPage[] = textResult.pages.map((p: any) => ({
          pageNumber: p.num ?? 1,
          text: (p.text ?? "").trim(),
        }))
        const fullText = textResult.text || pages.map((p) => p.text).join("\n\n")
        return { pages, fullText, pageCount: pages.length }
      }
      return {
        pages: [{ pageNumber: 1, text: (textResult?.text ?? "").trim() }],
        fullText: textResult?.text ?? "",
        pageCount: 1,
      }
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
    return {
      pages: [{ pageNumber: 1, text: fullText.trim() }],
      fullText,
      pageCount: 1,
    }
  }

  throw new Error("Pustaka pdf-parse tidak dapat diinisialisasi.")
}

/**
 * Downloads and parses a PDF document with in-memory caching.
 */
export async function getOrParsePdf(fileUrl: string): Promise<ExtractedPdfDocument | null> {
  const cached = pdfCache.get(fileUrl)
  const now = Date.now()
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.doc
  }

  try {
    const arrayBuffer = await downloadPdfBuffer(fileUrl)
    if (!arrayBuffer) return null

    const buffer = Buffer.from(arrayBuffer)
    const doc = await extractPagesFromBuffer(buffer)
    pdfCache.set(fileUrl, { doc, cachedAt: now })

    // Clean up cache if it grows too large (keep max 20 documents)
    if (pdfCache.size > 20) {
      const firstKey = pdfCache.keys().next().value
      if (firstKey) pdfCache.delete(firstKey)
    }

    return doc
  } catch (error) {
    console.error("[extractPages] Failed to parse PDF from URL:", error)
    return null
  }
}

/**
 * Scores and retrieves the most relevant pages from an extracted PDF document.
 * Combines exact phrase matching, word-boundary keyword matching, transposition/typo matching,
 * and acronym expansion.
 */
export function findRelevantPagesFromPdf(
  doc: ExtractedPdfDocument,
  rawQuery: string,
  maxPages = 4
): ExtractedPage[] {
  const queryWithTypos = normalizeTypos(rawQuery)
  const qClean = queryWithTypos.toLowerCase().replace(/[^a-z0-9]/g, " ")
  const qWords = Array.from(new Set(qClean.split(/\s+/).filter((w) => w.length > 1)))

  const scored = doc.pages.map((p) => {
    const textLower = p.text.toLowerCase()
    let score = 0

    // 1. Exact query phrase in page
    if (rawQuery.trim().length > 3 && textLower.includes(rawQuery.trim().toLowerCase())) {
      score += 150
    }

    // 2. Keyword matches
    for (const w of qWords) {
      if (textLower.includes(w)) {
        score += 10
        try {
          const regex = new RegExp(`\\b${w}\\b`, "gi")
          const matches = textLower.match(regex)
          if (matches) {
            // High weight for acronyms (length 3-5 in uppercase or standalone)
            const weight = w.length <= 5 ? 25 : 15
            score += matches.length * weight
          }
        } catch {
          // ignore regex errors
        }
      } else if (w.length >= 4) {
        // Transposition / typo check (e.g. obdc vs odbc)
        const wSorted = w.split("").sort().join("")
        const wordsInPage = textLower.replace(/[^a-z0-9]/g, " ").split(/\s+/)
        for (const pw of wordsInPage) {
          if (pw.length === w.length && pw.split("").sort().join("") === wSorted) {
            score += 30
          }
        }
      }
    }

    return { ...p, score }
  })

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score)

  const matched = scored.filter((p) => p.score > 0 && p.text.trim().length > 10)
  if (matched.length > 0) {
    return matched.slice(0, maxPages).map(({ pageNumber, text }) => ({ pageNumber, text }))
  }

  // If no specific match found, return the first few non-empty pages
  return doc.pages
    .filter((p) => p.text.trim().length > 15)
    .slice(0, maxPages)
    .map(({ pageNumber, text }) => ({ pageNumber, text }))
}
