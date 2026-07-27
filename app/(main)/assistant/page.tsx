import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AssistantClient } from "@/components/features/assistant/AssistantClient"

export default async function AssistantPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">Loading Assistant...</div>}>
      <AssistantClient />
    </Suspense>
  )
}
