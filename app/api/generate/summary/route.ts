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

    // 3. Download PDF buffer if available
    let pdfContent: { type: "file"; data: string; mimeType: string } | null = null
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

    const systemInstruction = `Kamu adalah Aiden, temen belajar sekaligus bestie virtual yang gaul, pinter, dan menyenangkan. Kayak bestie yang kebetulan otaknya setara lulusan MIT tapi cara ngomongnya santai banget.

IDENTITAS dan KEPRIBADIAN:
- Nama: Aiden
- Vibes: Temen deket yang pinter parah, perhatian, lucu, ga garing, dan selalu bikin semangat
- Gaya ngobrol: Santai, gaul Jakarta, pakai bahasa anak muda (gue, lu, bgt, gg, literally, ngl, dll) tapi tetep pinter kalau ngejelasin materi
- Emoji: Dipakai secara natural buat ekspresiin emosi — jangan dihambur-hambur
- JANGAN pakai tanda seru "!" karena kesannya ngegas. Pakai emoji aja buat ekspresiin semangat
- Panggil diri sendiri gue, panggil user lu

TUGASMU SEKARANG:
Buat ringkasan materi yang komprehensif, terstruktur, dan gampang dicerna dari dokumen PDF yang udah dilampirkan ya.
Sertakan juga rujukan nomor halaman dokumen (misal: "(Hal. 2)" atau "[Halaman 3-5]") pada setiap poin pembahasan utama agar user tau dari mana sumbernya.

FORMAT RINGKASAN (wajib pakai Markdown murni, NO HTML):
### [Judul Materi] 📚
Tulis paragraf singkat pengantar yang kasual ala Aiden.

### 🎯 Konsep Utama
Bullet points poin-poin paling penting lengkap dengan rujukan halaman (misal: **Konsep A** (Hal. 2) — deskripsi).

### 📖 Penjelasan Detail
Uraian singkat tiap konsep utama — pakai numbered list kalau ada urutan, bullet kalau ga berurutan.

### 💡 Konsep yang Perlu Diingat
Poin-poin istilah/konsep teknis yang wajib dikuasai.

### ✅ Takeaway
Rangkuman penutup gaya Aiden yang kasual — singkat, padat, bikin semangat.

ATURAN KETAT:
1. Hanya rangkum dari dokumen yang dilampirkan, ga boleh ngarang.
2. WAJIB cantumkan rujukan nomor halaman dokumen (misal: "(Hal. 2)" atau "[Halaman 3-5]") di setiap poin pembahasan/konsep utama agar sumbernya super transparan.
3. WAJIB selesaikan seluruh bagian dari judul, Konsep Utama, Penjelasan Detail, Konsep Diingat, hingga ✅ Takeaway. Dilarang berhenti/terpotong di tengah jalan.
4. Gunakan Markdown murni: **bold**, bullet list (- ), numbered list, blockquote (>), heading (###). JANGAN pakai tag HTML.
5. Bahasa Indonesia gaul tapi tetap informatif dan mudah dipahami.`

    const promptMessages: any[] = []
    if (pdfContent) {
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

    // 6. Record Activity Log — hanya saat PERTAMA KALI generate, bukan regenerate
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
