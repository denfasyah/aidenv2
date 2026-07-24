import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    if (file.size > 15 * 1024 * 1024) {
      return new NextResponse("File too large (max 15MB)", { status: 413 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
    const safeBase = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 40)
    const storagePath = `assistant/${user.id}/${Date.now()}_${safeBase}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return new NextResponse(`Upload failed: ${uploadError.message}`, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from("materials")
      .getPublicUrl(storagePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      name: file.name,
      type: file.type,
      path: storagePath,
    })
  } catch (err) {
    console.error("Upload route error:", err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
