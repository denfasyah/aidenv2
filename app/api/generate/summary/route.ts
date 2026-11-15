import { generateText } from "ai"
import { google, CHAT_MODEL } from "@/lib/ai/google"
import { downloadPdfBuffer } from "@/lib/ai/pdf"
import { getAllWorkspaceChunks, formatChunksForPrompt } from "@/lib/ai/rag-retriever"
import { createClient } from "@/utils/supabase/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { workspaceId, fileUrl, forceRegenerate } = await req.json()

    if (!workspaceId) {
      return new Response("Workspace ID is required", { status: 400 })
    }

    // 1. Check if summary already exists for this workspace (skip if forceRegenerate is true)
    const { data: existingSummary } = await supabase
      .from("summaries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single()

    // 2. Fetch workspace info to get the title
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("title")
      .eq("id", workspaceId)
      .single()

    const workspaceTitle = (workspace as any)?.title ?? "Dokumen"

    // If summary exists and NOT forced to regenerate, return cached version
    if (existingSummary && !forceRegenerate) {
      return Response.json({
        summary: existingSummary,
        cached: true,
      })
    }

    // 3. RAG Retrieval — Fetch document chunks from vector store for this workspace
    let contextText = ""
    const ragChunks = await getAllWorkspaceChunks(supabase, workspaceId)
    
    if (ragChunks.length > 0) {
      contextText = formatChunksForPrompt(ragChunks)
    }

    // Fallback: If chunks are not yet indexed, download PDF buffer
    let pdfContent: { type: "file"; data: string; mimeType: string } | null = null
    if (!contextText && fileUrl) {
      const pdfBuffer = await downloadPdfBuffer(fileUrl)
      if (pdfBuffer) {
        pdfContent = {
          type: "file",
          data: Buffer.from(pdfBuffer).toString("base64"),
          mimeType: "application/pdf",
        }
      }
    }

    const systemInstruction = `Kamu adalah Aiden, asisten belajar AI yang teliti, cerdas, dan komunikatif.

TUGAS UTAMA:
Buat ringkasan materi yang komprehensif, terstruktur, dan setia pada materi asli dari konteks dokumen yang disediakan.

ATURAN KETAT:
1. JANGAN MEMPARAFRASE SECARA BERLEBIHAN: Sajikan poin-poin penting, konsep kunci, istilah teknis, dan definisi sesuai dengan apa yang tertulis di dalam materi dokumen asli. Jangan mengubah makna atau menyederhanakan hingga esensi teknisnya hilang.
2. RUJUKAN NOMOR HALAMAN WAJIB TEPAT: Setiap poin pada Konsep Utama dan Penjelasan Detail WAJIB mencantumkan nomor halaman rujukan sesuai label [SUMBER DOKUMEN: Halaman X] yang ada di teks konteks (contoh: "(Hal. X)"). Dilarang menebak atau mengarang nomor halaman!
3. HANYA RANGKUM dari konteks materi yang disediakan, dilarang menambahkan materi dari luar dokumen.
4. FORMAT RINGKASAN (wajib Markdown murni):
### [Judul Materi] 📚
Tulis pengantar singkat materi.

### 🎯 Konsep Utama
- **[Nama Konsep]** (Hal. X) — definisi dan penjelasan inti sesuai materi dokumen.

### 📖 Penjelasan Detail
Uraian detail tiap konsep utama secara runut beserta rujukan halaman.

### 💡 Konsep yang Perlu Diingat
Poin-poin istilah/definisi penting yang wajib dikuasai dari materi.

### ✅ Takeaway
Rangkuman kesimpulan penutup materi.`

    const promptMessages: any[] = []
    if (contextText) {
      promptMessages.push({
        role: "user",
        content: `Halo Aiden! Tolong buatkan ringkasan materi komprehensif dan LENGKAP dari seluruh isi dokumen "${workspaceTitle}" ini berdasarkan konteks materi berikut ya!\n\n[KONTEKS DOKUMEN HASIL RETRIEVAL RAG]\n${contextText}`,
      })
    } else if (pdfContent) {
      promptMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Halo Aiden! Tolong buatkan ringkasan materi komprehensif dan LENGKAP dari seluruh isi dokumen "${workspaceTitle}" ini ya!`,
          },
          pdfContent,
        ],
      })
    } else {
      promptMessages.push({
        role: "user",
        content: `Halo Aiden! Tolong buatkan ringkasan materi dari workspace "${workspaceTitle}" ya!`,
      })
    }

    // 4. Generate Summary via Gemini API
    const { text: summaryText } = await generateText({
      model: google(CHAT_MODEL),
      system: systemInstruction,
      messages: promptMessages,
      temperature: 0.3,
      maxTokens: 8192,
    })

    let savedSummary: any = null

    // 5. Upsert into Supabase `summaries` table (Update if exists, Insert if new)
    if (existingSummary) {
      const { data: updated, error: updateError } = await supabase
        .from("summaries")
        .update({
          title: `Summary - ${workspaceTitle}`,
          content: { text: summaryText },
        })
        .eq("id", existingSummary.id)
        .select()
        .single()

      if (updateError) {
        console.error("Summary Update Error:", updateError)
        return new Response("Failed to update summary in database", { status: 500 })
      }
      savedSummary = updated
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("summaries")
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          title: `Summary - ${workspaceTitle}`,
          content: { text: summaryText },
        })
        .select()
        .single()

      if (insertError) {
        console.error("Summary Insert Error:", insertError)
        return new Response("Failed to save summary to database", { status: 500 })
      }
      savedSummary = inserted
    }

    // 6. Record Activity Log — update timestamp on regenerate, insert on first generate
    if (!existingSummary) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        workspace_id: workspaceId,
        action_type: "GENERATE_SUMMARY",
        details: {
          title: workspaceTitle,
          target_url: `/workspaces/${workspaceId}?tab=summary`,
        },
      })

      // Kirim notifikasi ke user
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Ringkasan Berhasil Dibuat",
        message: `Ringkasan dari dokumen "${workspaceTitle}" berhasil digenerate.`,
      })
    } else {
      await supabase
        .from("activity_logs")
        .update({
          created_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("workspace_id", workspaceId)
        .eq("action_type", "GENERATE_SUMMARY")
    }

    return Response.json({
      summary: savedSummary,
      cached: false,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("Summary API Error:", error)
    return new Response(message, { status: 500 })
  }
}
