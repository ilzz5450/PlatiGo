import type { Stagehand } from "@browserbasehq/stagehand"

export async function agent({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const trimmed = (instruction ?? "").trim()

  if (!trimmed) {
    throw new Error(
      `iluzzio(Agent): invalid or missing instruction for this step (got "${instruction}"). ` +
        `Enter instructions like "Sign in with username 'xxx' and password 'yyy'" or multi-line steps.`
    )
  }

  // Reuse the session's first page if available, or create one.
  let [page] = await stagehand.browser.context.pages()
  if (!page) {
    page = await stagehand.browser.context.newPage()
  }

  // Parse multi-line or semicolon-separated instructions into sub-steps
  const lines = trimmed
    .split(/[\r\n;]+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const stepsToRun = lines.length > 0 ? lines : [trimmed]
  let stepsCompleted = 0
  const stepSummaries: string[] = []

  try {
    for (const rawStep of stepsToRun) {
      const lower = rawStep.toLowerCase()
      const isUsernameStep =
        (lower.includes("username") || lower.includes("email")) &&
        !lower.includes("click") &&
        !lower.includes("submit")

      // Direct fast instruction with smart auto-continue intent
      const fastInstruction = isUsernameStep
        ? `${rawStep}. If a Next, Continue, or Submit button appears or is required to proceed, click it.`
        : rawStep

      // Fast single-pass execution (no double observe latency)
      await stagehand.act(fastInstruction)
      stepsCompleted++
      stepSummaries.push(`Executed: ${rawStep}`)

      // Smart auto-advance for two-step login flows (e.g. Google, Microsoft, Slack)
      if (isUsernameStep) {
        try {
          const { data: nextActions } = await stagehand.observe(
            "Click Next, Continue, or Submit if present on the form"
          )
          if (nextActions && nextActions.length > 0 && nextActions[0]) {
            await stagehand.act(nextActions[0])
            stepSummaries.push("Auto-advanced: clicked Next/Continue")
          }
        } catch {
          // Single-page form or no next button required
        }
      }

      // Micro-pause for ultra-fast execution
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const finalUrl = (await page.url()) || ""
    const message = `iluzzio(Agent) completed ${stepsCompleted} step(s) fast:\n${stepSummaries.join(
      "\n"
    )}\nFinal page: ${finalUrl}`

    return {
      success: true,
      message,
      completed: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `iluzzio(Agent): task execution failed on step "${
        stepsToRun[stepsCompleted] || trimmed
      }". ${errorMessage}`,
      { cause: error }
    )
  }
}
