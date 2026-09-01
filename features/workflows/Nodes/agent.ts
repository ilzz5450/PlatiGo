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
        `Enter an instruction like "Find laptops and open the top result" or reference an upstream node.`
    )
  }

  // Reuse the session's first page if available, or create one.
  let [page] = await stagehand.browser.context.pages()
  if (!page) {
    page = await stagehand.browser.context.newPage()
  }

  const MAX_STEPS = 5
  let stepsCompleted = 0

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const { data: actions } = await stagehand.observe(trimmed)

      if (!actions || actions.length === 0) {
        break
      }

      const candidate = actions[0]
      if (!candidate) break

      await stagehand.act(candidate)
      stepsCompleted++
    }

    const finalUrl = (await page.url()) || ""
    const message = `iluzzio(Agent) completed task in ${stepsCompleted} step(s). Final page: ${finalUrl}`

    return {
      success: true,
      message,
      completed: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `iluzzio(Agent): task execution failed for "${trimmed}". ${errorMessage}`,
      { cause: error }
    )
  }
}
