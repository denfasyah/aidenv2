import { generateText } from "ai"
import { google, CHAT_MODEL } from "@/lib/ai/google"
import { downloadPdfBuffer } from "@/lib/ai/pdf"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { workspaceId, fileUrl, cardCount = 5, forceRegenerate = false } = await req.json()

    if (!workspaceId) {
      return new Response("Workspace ID is required", { status: 400 })
    }

    // 1. Check existing flashcard data
    const { data: existing } = await supabase
      .from("flashcards")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single()

    // Return cached if available and not forced to regenerate
    if (existing && !forceRegenerate) {
      return Response.json({ flashcards: existing, cached: true })
    }

    // 2. Get workspace title
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("title")
      .eq("id", workspaceId)
      .single()

    const workspaceTitle = (workspace as any)?.title ?? "Dokumen"
    const count = cardCount === 10 ? 10 : 5

    // 3. Download PDF
    let pdfContent: any = null
    if (fileUrl) {
      const pdfBuffer = await downloadPdfBuffer(fileUrl)
      if (pdfBuffer) {
        pdfContent = {
          type: "file",
          data: Buffer.from(pdfBuffer).toString("base64"),
          mimeType: "application/pdf",
        }
      }
    }

    // 4. System prompt for structured JSON output
    const systemInstruction = `Kamu adalah Aiden, temen belajar yang gaul dan pinter. Tugasmu bikin flashcard dari materi.

PENTING: Output HANYA berupa JSON valid. TANPA markdown, TANPA backtick, TANPA penjelasan apapun. Langsung JSON mentah.

Format JSON yang WAJIB diikuti:
{"cards":[{"front":"pertanyaan singkat","back":"jawaban singkat 1-2 kalimat"},{"front":"...","back":"..."}]}

ATURAN KETAT:
- Buat TEPAT ${count} flashcard — tidak boleh lebih, tidak boleh kurang
- Front: pertanyaan/soal singkat tentang konsep penting dari dokumen
- Back: jawaban/penjelasan singkat padat (max 2 kalimat) beserta rujukan halaman dokumen jika ada (misal: "Jaringan komputer adalah ... (Hal. 2)")
- Bahasa Indonesia yang jelas dan mudah dipahami
- HANYA dari isi dokumen yang dilampirkan
- Output MURNI JSON saja, tidak ada teks lain sebelum atau sesudah JSON`

    const messages: any[] = []
    if (pdfContent) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Buat tepat ${count} flashcard dari dokumen "${workspaceTitle}" ini.`,
          },
          pdfContent,
        ],
      })
    } else {
      messages.push({
        role: "user",
        content: `Buat tepat ${count} flashcard dari materi "${workspaceTitle}".`,
      })
    }

    // 5. Generate flashcards via Gemini
    const { text } = await generateText({
      model: google(CHAT_MODEL),
      system: systemInstruction,
      messages,
      temperature: 0.2,
      maxTokens: 2000,
    })

    // 6. Robust JSON Extraction & Parsing
    let cards: { front: string; back: string }[] = []
    try {
      // Clean standard codeblocks
      let cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim()

      // Extract JSON object if text contains extra explanations
      const jsonMatch = cleaned.match(/\{[\s\S]*"cards"[\s\S]*\}/)
      if (jsonMatch) {
        cleaned = jsonMatch[0]
      }

      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed.cards)) {
        cards = parsed.cards.filter((c: any) => c && c.front && c.back)
      }
    } catch (parseErr) {
      console.error("JSON parse error. Raw AI output:", text, parseErr)
      return new Response("Gagal memproses hasil AI. Coba generate ulang.", { status: 500 })
    }

    if (cards.length === 0) {
      return new Response("AI tidak menghasilkan flashcard. Coba generate ulang.", { status: 500 })
    }

    // 7. Upsert to Supabase
    let savedFlashcard: any = null

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("flashcards")
        .update({
          title: `Flashcard - ${workspaceTitle}`,
          content: { cards, cardCount: count },
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (updateError) {
        console.error("Flashcard Update Error:", updateError)
        return new Response("Gagal update flashcard di database", { status: 500 })
      }
      savedFlashcard = updated
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("flashcards")
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          title: `Flashcard - ${workspaceTitle}`,
          content: { cards, cardCount: count },
        })
        .select()
        .single()

      if (insertError) {
        console.error("Flashcard Insert Error:", insertError)
        return new Response("Gagal simpan flashcard ke database", { status: 500 })
      }
      savedFlashcard = inserted
    }

    // 8. Activity Log — hanya dicatat saat PERTAMA KALI generate, bukan saat regenerate
    if (!existing) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        workspace_id: workspaceId,
        action_type: "GENERATE_FLASHCARD",
        details: {
          title: workspaceTitle,
          target_url: `/workspaces/${workspaceId}?tab=flashcard`,
          cardCount: count,
        },
      })
    }

    return Response.json({ flashcards: savedFlashcard, cached: false })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("Flashcard API Error:", error)
    return new Response(message, { status: 500 })
  }
}
