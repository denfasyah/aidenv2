import { streamText, smoothStream } from "ai"
import { google, CHAT_MODEL } from "@/lib/ai/google"
import { buildGlobalAssistantPrompt } from "@/lib/ai/prompts"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages are required", { status: 400 })
    }

    // Process messages and mapping any attachments to base64 parts for Gemini
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiMessages: any[] = messages.map((msg: any) => {
      if (
        msg.role === "user" &&
        msg.experimental_attachments &&
        msg.experimental_attachments.length > 0
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [{ type: "text", text: msg.content || "" }]
        for (const attachment of msg.experimental_attachments) {
          try {
            const base64Data = attachment.url.split(",")[1] || attachment.url
            if (attachment.contentType.startsWith("image/")) {
              parts.push({
                type: "image",
                image: base64Data,
                mimeType: attachment.contentType,
              })
            } else if (attachment.contentType === "application/pdf") {
              parts.push({
                type: "file",
                data: base64Data,
                mimeType: attachment.contentType,
              })
            }
          } catch (e) {
            console.error("Error processing attachment:", e)
          }
        }
        return {
          role: "user",
          content: parts,
        }
      }
      return {
        role: msg.role,
        content: msg.content,
      }
    })

    const result = streamText({
      model: google(CHAT_MODEL),
      system: buildGlobalAssistantPrompt(),
      messages: aiMessages,
      temperature: 0.7,
      experimental_transform: smoothStream({ delayInMs: 40, chunking: "word" }),
    })

    return result.toDataStreamResponse()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    console.error("Assistant Chat API Error:", error)
    return new Response(message, { status: 500 })
  }
}
