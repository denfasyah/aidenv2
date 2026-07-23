import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { workspaceId, userAnswers, scorePercentage, correctCount, totalCount } = await req.json()

    if (!workspaceId) {
      return new Response("Workspace ID is required", { status: 400 })
    }

    // 1. Fetch current quiz
    const { data: quiz, error: fetchErr } = await supabase
      .from("quizzes")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single()

    if (fetchErr || !quiz) {
      return new Response("Quiz not found", { status: 404 })
    }

    const content = typeof quiz.content === "object" && quiz.content !== null ? quiz.content : {}
    const attempts = Array.isArray(content.attempts) ? content.attempts : []

    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    const newAttempt = {
      attempt_id: attemptId,
      created_at: new Date().toISOString(),
      score_percentage: scorePercentage,
      correct_count: correctCount,
      total_count: totalCount,
      user_answers: userAnswers, // Record of user selected indices: { [questionIndex]: selectedOptionIndex }
    }

    const updatedAttempts = [newAttempt, ...attempts]

    // 2. Update quiz JSON with new attempt
    const { data: updatedQuiz, error: updateErr } = await supabase
      .from("quizzes")
      .update({
        content: {
          ...content,
          attempts: updatedAttempts,
        },
      })
      .eq("id", quiz.id)
      .select()
      .single()

    if (updateErr) {
      console.error("Save Quiz Attempt Error:", updateErr)
      return new Response("Failed to save attempt", { status: 500 })
    }

    // 3. Get workspace title for Activity Log
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("title")
      .eq("id", workspaceId)
      .single()

    const workspaceTitle = (workspace as any)?.title ?? "Dokumen"

    // 4. Insert detailed log entry per attempt to activity_logs
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      workspace_id: workspaceId,
      action_type: "SUBMIT_QUIZ_ATTEMPT",
      details: {
        title: workspaceTitle,
        attempt_id: attemptId,
        score: `${scorePercentage}%`,
        correct: `${correctCount}/${totalCount}`,
        target_url: `/workspaces/${workspaceId}?tab=quiz&attempt_id=${attemptId}`,
      },
    })

    return Response.json({
      attempt: newAttempt,
      quiz: updatedQuiz,
    })
  } catch (err) {
    console.error("Submit Quiz Attempt API Error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}
