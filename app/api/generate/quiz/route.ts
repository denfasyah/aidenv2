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

    const { workspaceId, fileUrl, questionCount = 5, forceRegenerate = false } = await req.json()

    if (!workspaceId) {
      return new Response("Workspace ID is required", { status: 400 })
    }

    // 1. Check existing quiz
    const { data: existing } = await supabase
      .from("quizzes")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single()

    if (existing && !forceRegenerate) {
      return Response.json({ quiz: existing, cached: true })
    }

    // 2. Fetch workspace title
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("title")
      .eq("id", workspaceId)
      .single()

    const workspaceTitle = (workspace as any)?.title ?? "Dokumen"
    const count = questionCount === 10 ? 10 : 5

    // 3. Download PDF buffer if fileUrl provided
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

    // 4. System Instruction for JSON generation with page number references
    const systemInstruction = `Kamu adalah Aiden, asisten belajar AI yang pintar dan teliti. Tugasmu membuat kuis pilihan ganda interaktif dari dokumen PDF.

PENTING: Output HANYA berupa JSON valid. TANPA markdown block, TANPA \`\`\`json, TANPA teks penjelasan sebelum/sesudah JSON.

Format JSON yang WAJIB diikuti:
{
  "questions": [
    {
      "id": 1,
      "question": "teks pertanyaan...",
      "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"],
      "answerIndex": 0,
      "explanation": "Penjelasan AI ringkas dan jelas mengapa jawaban tersebut benar...",
      "pageRef": "Hal. 2"
    }
  ]
}

ATURAN KETAT:
- Buat TEPAT ${count} soal pilihan ganda.
- Setiap soal mempunyai 4 pilihan jawaban (options).
- answerIndex adalah indeks 0-based dari pilihan yang benar (0 untuk pilihan 1, 1 untuk pilihan 2, 2 untuk pilihan 3, 3 untuk pilihan 4).
- explanation: Uraian singkat padat yang menjelaskan alasan kebenaran jawaban berdasarkan dokumen.
- pageRef: WAJIB sertakan nomor halaman dokumen tempat jawaban ditemukan, contoh: "Hal. 2", "Hal. 4", atau "Hal. 5-6".
- Gunakan Bahasa Indonesia yang baik, akademis namun mudah dipahami.
- Sumber materi HANYA dari isi dokumen PDF yang dilampirkan.`

    const messages: any[] = []
    if (pdfContent) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Buat tepat ${count} soal kuis dari dokumen "${workspaceTitle}" ini. Pastikan menyertakan rujukan nomor halaman (pageRef) pada setiap soal.`,
          },
          pdfContent,
        ],
      })
    } else {
      messages.push({
        role: "user",
        content: `Buat tepat ${count} soal kuis dari materi "${workspaceTitle}".`,
      })
    }

    // 5. Generate via Gemini
    const { text } = await generateText({
      model: google(CHAT_MODEL),
      system: systemInstruction,
      messages,
      temperature: 0.2,
      maxTokens: 4000,
    })

    // 6. JSON Parsing
    let questions: any[] = []
    try {
      let cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim()

      const jsonMatch = cleaned.match(/\{[\s\S]*"questions"[\s\S]*\}/)
      if (jsonMatch) {
        cleaned = jsonMatch[0]
      }

      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed.questions)) {
        questions = parsed.questions.filter(
          (q: any) => q && q.question && Array.isArray(q.options) && q.options.length === 4
        )
      }
    } catch (parseErr) {
      console.error("Quiz JSON parse error. Raw AI output:", text, parseErr)
      return new Response("Gagal memproses hasil AI kuis. Coba generate ulang.", { status: 500 })
    }

    if (questions.length === 0) {
      return new Response("AI tidak menghasilkan soal kuis valid. Coba generate ulang.", { status: 500 })
    }

    // 7. Save / Upsert to Supabase
    let savedQuiz: any = null

    if (existing) {
      const existingContent = typeof existing.content === "object" ? existing.content : {}
      const attempts = existingContent?.attempts || []

      const { data: updated, error: updateError } = await supabase
        .from("quizzes")
        .update({
          title: `Quiz - ${workspaceTitle}`,
          content: { questions, questionCount: count, attempts },
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (updateError) {
        console.error("Quiz Update Error:", updateError)
        return new Response("Gagal update quiz di database", { status: 500 })
      }
      savedQuiz = updated
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("quizzes")
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          title: `Quiz - ${workspaceTitle}`,
          content: { questions, questionCount: count, attempts: [] },
        })
        .select()
        .single()

      if (insertError) {
        console.error("Quiz Insert Error:", insertError)
        return new Response("Gagal simpan quiz ke database", { status: 500 })
      }
      savedQuiz = inserted
    }

    // 8. Log activity — hanya saat PERTAMA KALI generate, bukan regenerate
    // (Attempt quiz tetap dicatat terpisah via submit-attempt route)
    if (!existing) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        workspace_id: workspaceId,
        action_type: "GENERATE_QUIZ",
        details: {
          title: workspaceTitle,
          target_url: `/workspaces/${workspaceId}?tab=quiz`,
          questionCount: count,
        },
      })
    }

    return Response.json({ quiz: savedQuiz, cached: false })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("Quiz API Error:", error)
    return new Response(message, { status: 500 })
  }
}
