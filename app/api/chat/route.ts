import { streamText, smoothStream } from "ai"
import { google, CHAT_MODEL } from "@/lib/ai/google"
import { retrieveRelevantChunks } from "@/lib/ai/rag-retriever"
import { buildSystemPrompt } from "@/lib/ai/prompts"
import { createClient } from "@/utils/supabase/server"
import { downloadPdfBuffer } from "@/lib/ai/pdf"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { messages, workspaceId, fileUrl } = await req.json()

    if (!workspaceId) {
      return new Response("Workspace ID is required", { status: 400 })
    }

    // Validate workspace belongs to this user (security: no cross-workspace leak)
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, title")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (workspaceError || !workspace) {
      return new Response("Workspace not found or access denied", { status: 403 })
    }

    // Activity log on first message
    if (Array.isArray(messages) && messages.length === 1) {
      const firstMessageText = messages[0].content || ""
      const truncatedTitle = firstMessageText.length > 30
        ? firstMessageText.slice(0, 30) + "..."
        : firstMessageText

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        workspace_id: workspaceId,
        action_type: "ASSISTANT_CHAT",
        details: {
          title: truncatedTitle || "Diskusi Materi",
          target_url: `/workspaces/${workspaceId}?tab=chat`,
        },
      })
    }

    // ── RAG Retrieval ─────────────────────────────────────────────────────────
    const lastMessage = messages[messages.length - 1]
    let contextText = ""

    if (lastMessage?.role === "user" && lastMessage.content) {
      const userQuery = lastMessage.content

      // Try vector RAG chunks from Supabase first
      const chunks = await retrieveRelevantChunks(supabase, {
        workspaceId,
        userId: user.id,
        query: userQuery,
        matchCount: 6,
      })

      if (chunks && chunks.length > 0) {
        contextText = chunks
          .map((c, idx) => {
            const page = c.metadata?.page_number
            const pageLabel = page ? `Halaman ${page}` : `Bagian #${idx + 1}`
            return `[SUMBER DOKUMEN: ${pageLabel}]\n${c.content.trim()}`
          })
          .join("\n\n---\n\n")
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // If RAG chunks are not yet indexed, fallback to Multimodal PDF directly (same as Summary & Flashcard)
    let pdfFilePart: { type: "file"; data: string; mimeType: string } | null = null
    if (!contextText && fileUrl) {
      try {
        const pdfBuffer = await downloadPdfBuffer(fileUrl)
        if (pdfBuffer) {
          pdfFilePart = {
            type: "file",
            data: Buffer.from(pdfBuffer).toString("base64"),
            mimeType: "application/pdf",
          }
        }
      } catch (pdfErr) {
        console.error("[Chat API] PDF fallback error:", pdfErr)
      }
    }

    // Build AI messages list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiMessages: any[] = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })
    )

    // If using Multimodal PDF fallback, attach PDF to the user's latest query
    if (pdfFilePart && aiMessages.length > 0) {
      const lastAiMsg = aiMessages[aiMessages.length - 1]
      if (lastAiMsg.role === "user") {
        lastAiMsg.content = [
          { type: "text", text: typeof lastAiMsg.content === "string" ? lastAiMsg.content : "" },
          pdfFilePart,
        ]
      }
    }

    // Inject RAG context into system prompt
    let systemContent = buildSystemPrompt()
    if (contextText) {
      systemContent +=
        `\n\n[KONTEKS MATERI DOKUMEN — HASIL RETRIEVAL RAG]\n` +
        `Berikut adalah kutipan teks materi asli dari dokumen yang relevan dengan pertanyaan user:\n\n` +
        `${contextText}\n\n` +
        `PEDOMAN KETAT DAN WAJIB DIPATUHI:\n` +
        `1. KEASLIAN TEKS (JANGAN DIPARAFRASE): Sampaikan penjelasan konsep, definisi, dan fakta SESUAI dengan apa yang tertulis pada teks materi di atas. Jangan memparafrase secara berlebihan yang berisiko mengubah arti atau detail materi asli.\n` +
        `2. RUJUKAN HALAMAN AKURAT: Di setiap akhir poin jawaban atau penjelasan konsep, WAJIB cantumkan sitasi nomor halaman yang tertera pada label [SUMBER DOKUMEN: Halaman X] di atas (contoh format: "(Hal. X)"). DILARANG mengarang nomor halaman jika tidak tertera di sumber konteks.\n` +
        `3. KEJUJURAN INFORMASI: Jika informasi atau jawaban dari pertanyaan user tidak ada di dalam teks konteks di atas, katakan dengan jujur dan ramah: "hmm info ini ga ada di materi dokumen yang lu kasih ke gue 🤔". DILARANG mengarang informasi dari luar konteks dokumen.\n` +
        `4. Tetap gunakan nada bicara Aiden yang ramah dan nyaman dibaca, tetapi substansi jawaban harus setia 100% pada teks dokumen.`
    } else if (pdfFilePart) {
      systemContent +=
        `\n\n[DOKUMEN PDF DILAMPIRKAN LANGSUNG]\n` +
        `User melampirkan seluruh dokumen PDF ke percakapan ini.\n` +
        `PEDOMAN KETAT:\n` +
        `1. Jawab pertanyaan user berdasarkan isi dokumen PDF yang dilampirkan.\n` +
        `2. Cantumkan rujukan nomor halaman/slide asli dokumen tempat informasi ditemukan dalam format: (Hal. X) atau (Slide X).\n` +
        `3. Jangan memparafrase berlebihan konsep atau definisi teknis, sampaikan sesuai teks asli materi.`
    } else {
      systemContent +=
        `\n\n[KONTEKS DARI DOKUMEN — TIDAK ADA HASIL RETRIEVAL]\n` +
        `Tidak ditemukan kutipan materi yang relevan dari dokumen untuk pertanyaan ini. ` +
        `Katakan dengan ramah kepada user bahwa informasi tersebut tidak ditemukan pada dokumen modul materi.`
    }

    const result = streamText({
      model: google(CHAT_MODEL),
      system: systemContent,
      messages: aiMessages,
      temperature: 0.1, // Rendah agar deterministik, akurat, dan tidak mengarang/berhalusinasi
      experimental_transform: smoothStream({ delayInMs: 20, chunking: "word" }),
    })

    return result.toDataStreamResponse()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("[Chat API] Error:", error)
    return new Response(message, { status: 500 })
  }
}
