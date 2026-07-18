import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { WorkspaceDetailClient } from "@/components/features/workspaces/workspace-detail-client"

interface WorkspacePageProps {
  params: Promise<{ id: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Fetch workspace metadata
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !workspace) {
    notFound()
  }

  // 2. Fetch file info from storage (materials/user_id/workspace_id/)
  const folderPath = `${user.id}/${workspace.id}`
  const { data: allFiles, error: filesError } = await supabase.storage
    .from("materials")
    .list(folderPath, {
      sortBy: { column: "created_at", order: "desc" }
    })

  // Filter out any placeholder files or folders (Supabase sometimes returns .emptyFolderPlaceholder)
  const files = allFiles?.filter((f: any) => f.name !== '.emptyFolderPlaceholder' && f.name !== '.empty') || []

  let fileInfo = null

  if (!filesError && files.length > 0) {
    const file = files[0]
    // Get signed URL for 12 hours
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("materials")
      .createSignedUrl(`${folderPath}/${file.name}`, 60 * 60 * 12)

    if (signedUrlData?.signedUrl) {
      // Remove timestamp prefix (e.g. 1735623_filename.pdf) for display
      const displayName = file.name.replace(/^\d+_/, '')
      
      fileInfo = {
        name: displayName,
        size: file.metadata?.size || 0,
        url: signedUrlData.signedUrl
      }
    } else {
      // Debug for signedUrl failure
      fileInfo = {
        name: `ERROR: ${signedUrlError?.message || 'Unknown signed URL error'}`,
        size: 0,
        url: ""
      }
    }
  } else if (filesError) {
    fileInfo = {
      name: `ERROR: ${filesError.message}`,
      size: 0,
      url: ""
    }
  } else if (!files || files.length === 0) {
    fileInfo = {
      name: `ERROR: No files found in folder ${folderPath}`,
      size: 0,
      url: ""
    }
  } else {
    fileInfo = {
      name: `DEBUG: files=${JSON.stringify(files)}`,
      size: 0,
      url: ""
    }
  }

  return <WorkspaceDetailClient workspace={workspace} fileInfo={fileInfo} />
}

