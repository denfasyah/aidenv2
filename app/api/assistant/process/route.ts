import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { processDocument } from "@/utils/rag/processor"

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { workspaceId, documentId, filePath } = await req.json()

    if (!workspaceId || !documentId || !filePath) {
      return new NextResponse("Missing parameters", { status: 400 })
    }

    // Call process asynchronously or synchronously. Since we want an API response immediately,
    // in a real environment we'd use waitUntil or a background queue. 
    // Here we'll just process it synchronously and return success/failure, or fire and forget.
    // Let's do it synchronously to get the status. Vercel function timeout is usually 10-60s.
    
    const result = await processDocument(supabase, workspaceId, user.id, filePath, documentId)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Process route error:", err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
