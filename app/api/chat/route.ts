import { streamText, smoothStream, embed } from "ai"
import { google, CHAT_MODEL, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from "@/lib/ai/google"
import { buildSystemPrompt } from "@/lib/ai/prompts"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { messages, workspaceId } = await req.json()

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
      try {
        // 1. Embed the user query using gemini-embedding-001 (3072 dims)
        const { embedding } = await embed({
          model: google.textEmbeddingModel(EMBEDDING_MODEL, {
            outputDimensionality: EMBEDDING_DIMENSIONS,
          }),
          value: lastMessage.content,
        })

        // 2. Similarity search — scoped strictly to this workspace (RLS + filter)
        const { data: chunks, error: matchError } = await supabase.rpc(
          "match_document_chunks",
          {
            query_embedding: embedding,
            match_count: 5,
            filter_workspace_id: workspaceId,
            filter_user_id: user.id,
          }
        )

        if (matchError) {
          console.error("[RAG] match_document_chunks error:", matchError.message)
        } else if (chunks && chunks.length > 0) {
          contextText = (chunks as Array<{ content: string; similarity: number }>)
            .map(c => c.content)
            .join("\n\n---\n\n")
        }
      } catch (embErr) {
        console.error("[RAG] Embedding/retrieval error:", embErr)
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Build AI messages list
    const aiMessages: { role: string; content: string }[] = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })
    )

    // Inject RAG context into system prompt
    let systemContent = buildSystemPrompt()
    if (contextText) {
      systemContent +=
        `\n\n[KONTEKS DARI DOKUMEN — HASIL RETRIEVAL]\n` +
        `Berikut adalah cuplikan materi yang paling relevan dengan pertanyaan user:\n\n` +
        `${contextText}\n\n` +
        `Aturan ketat:\n` +
        `- Jawab HANYA berdasarkan konteks di atas.\n` +
        `- Jika informasi tidak ada di konteks, katakan dengan jujur: "hmm info ini kayanya ga ada di dokumen yang lu kasih ke gue 🤔"\n` +
        `- Jangan mengarang atau menambah info dari luar dokumen.`
    } else {
      systemContent +=
        `\n\n[KONTEKS DARI DOKUMEN — TIDAK ADA HASIL RETRIEVAL]\n` +
        `Tidak ditemukan informasi yang relevan dari dokumen untuk pertanyaan ini. ` +
        `Beritahu user dengan ramah bahwa jawaban tidak tersedia di dokumen.`
    }

    const result = streamText({
      model: google(CHAT_MODEL),
      system: systemContent,
      messages: aiMessages as any,
      temperature: 0.7,
      experimental_transform: smoothStream({ delayInMs: 40, chunking: "word" }),
    })

    return result.toDataStreamResponse()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("[Chat API] Error:", error)
    return new Response(message, { status: 500 })
  }
}
