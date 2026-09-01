import type { Stagehand } from "@browserbasehq/stagehand"

export async function observation({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const trimmed = (instruction ?? "").trim()

  if (!trimmed) {
    throw new Error(
      `Observation: invalid or missing instruction for this step (got "${instruction}"). ` +
        `Enter an instruction like "Find all sign in buttons" or reference an upstream node.`
    )
  }

  // Reuse the session's first page if available, or create one.
  let [page] = await stagehand.browser.context.pages()
  if (!page) {
    page = await stagehand.browser.context.newPage()
  }

  try {
    const observeResult = await stagehand.observe(trimmed)
    const rawActions = (observeResult as any)?.data ?? observeResult ?? []
    const actionsList = Array.isArray(rawActions) ? rawActions : []

    const matches = actionsList.map((action: any) => ({
      selector: action.selector ?? "",
      description: action.description ?? action.method ?? String(action),
    }))

    return {
      matches,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Observation: failed to observe page for "${trimmed}". ${errorMessage}`,
      { cause: error }
    )
  }
}
