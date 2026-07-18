import { streamText, smoothStream } from "ai"
import { google, CHAT_MODEL } from "@/lib/ai/google"
import { downloadPdfBuffer } from "@/lib/ai/pdf"
import { buildSystemPrompt } from "@/lib/ai/prompts"

export async function POST(req: Request) {
  try {
    const { messages, workspaceId, fileUrl } = await req.json()

    if (!workspaceId) {
      return new Response("Workspace ID is required", { status: 400 })
    }

    // Build the conversation messages for the AI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiMessages: any[] = []

    // If we have a file, prepend a "system user" message with the PDF attached.
    // This is placed as the very first message so Gemini has full document context
    // for the ENTIRE conversation, not just the first user message.
    if (fileUrl) {
      const pdfBuffer = await downloadPdfBuffer(fileUrl)
      if (pdfBuffer) {
        aiMessages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: "Ini adalah dokumen materi yang akan kita pelajari. Harap analisis seluruh isinya dan gunakan sebagai referensi utama untuk semua pertanyaan saya berikutnya.",
            },
            {
              type: "file",
              data: Buffer.from(pdfBuffer).toString("base64"),
              mimeType: "application/pdf",
            },
          ],
        })
        // Mandatory model acknowledgement to keep the conversation valid
        aiMessages.push({
          role: "assistant",
          content: "Oke, dokumennya udah gue baca nih. Siap bantu lu belajar dari materi ini ya, gaskeun tanya aja",
        })
      } else {
        console.warn("PDF download failed — proceeding without file attachment")
      }
    }

    // Append the actual user conversation after the document context
    for (const msg of messages) {
      aiMessages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    const result = streamText({
      model: google(CHAT_MODEL),
      system: buildSystemPrompt(),
      messages: aiMessages,
      temperature: 0.7,
      experimental_transform: smoothStream({ delayInMs: 40, chunking: "word" }),
    })

    return result.toDataStreamResponse()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("Chat API Error:", error)
    return new Response(message, { status: 500 })
  }
}
