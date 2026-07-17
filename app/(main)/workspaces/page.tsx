import { createClient } from "@/utils/supabase/server"
import { WorkspaceCard } from "@/components/features/workspaces/workspace-card"
import { CreateWorkspaceDialog } from "@/components/features/workspaces/create-workspace-dialog"
import { WorkspaceControls } from "@/components/features/workspaces/workspace-controls"
import { WorkspacePagination } from "@/components/features/workspaces/workspace-pagination"
import { FolderKanban, BookOpen } from "lucide-react"
import { Suspense } from "react"

const PAGE_SIZE = 8

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function WorkspacesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = (Array.isArray(params.search) ? params.search[0] : params.search) ?? ""
  const sort = (Array.isArray(params.sort) ? params.sort[0] : params.sort) ?? "newest"
  const pageStr = Array.isArray(params.page) ? params.page[0] : params.page
  const page = Math.max(1, parseInt(pageStr ?? "1", 10))

  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Build query with optional search
  let query = supabase
    .from("workspaces")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)

  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  // Sorting
  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true })
  } else if (sort === "az") {
    query = query.order("title", { ascending: true })
  } else if (sort === "favorite") {
    // Jika kolom is_favorite belum ada, fallback ke newest
    query = query.order("is_favorite", { ascending: false }).order("created_at", { ascending: false })
  } else {
    // newest (default)
    query = query.order("created_at", { ascending: false })
  }

  // Pagination
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  const { data: workspaces, error, count } = await query

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1
  const totalCount = count ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Education Engine</div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Smart Learning Workspace</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Upload materi PDF dan biarkan AI membantu Anda belajar lebih cepat.
            </p>
          </div>
        </div>
        <CreateWorkspaceDialog />
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Suspense fallback={<div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />}>
          <WorkspaceControls />
        </Suspense>
        {totalCount > 0 && (
          <p className="text-sm text-muted-foreground flex-shrink-0">
            {totalCount} workspace{totalCount !== 1 ? "" : ""}
          </p>
        )}
      </div>

      {/* Grid Workspaces */}
      {error ? (
        <div className="p-8 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          Gagal memuat workspaces: {error.message}
        </div>
      ) : !workspaces || workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-2xl bg-card/50 min-h-[320px] gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <FolderKanban className="h-8 w-8" />
          </div>
          {search ? (
            <>
              <h3 className="text-lg font-semibold text-foreground">Tidak ada hasil untuk &quot;{search}&quot;</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Coba gunakan kata kunci yang berbeda.</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-foreground">Belum ada Workspace</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-2">
                Mulai perjalanan belajar Anda dengan membuat workspace pertama dan upload materi PDF.
              </p>
              <CreateWorkspaceDialog />
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workspaces.map((workspace: any) => (
              <WorkspaceCard
                key={workspace.id}
                id={workspace.id}
                title={workspace.title}
                description={workspace.description}
                createdAt={workspace.created_at}
                isFavorite={workspace.is_favorite ?? false}
              />
            ))}
          </div>

          {/* Pagination */}
          <Suspense>
            <WorkspacePagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </>
      )}
    </div>
  )
}
