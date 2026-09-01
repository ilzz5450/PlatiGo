import type { Stagehand } from "@browserbasehq/stagehand"

export async function act({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const trimmed = (instruction ?? "").trim()

  if (!trimmed) {
    throw new Error(
      `Act: invalid or missing action instruction for this step (got "${instruction}"). ` +
        `Enter an instruction like "Click the sign in button" or reference an upstream node.`
    )
  }

  // Reuse the session's first page if available, or create one.
  let [page] = await stagehand.browser.context.pages()
  if (!page) {
    page = await stagehand.browser.context.newPage()
  }

  try {
    const actResult = await stagehand.act(trimmed)
    const finalUrl = (await page.url()) || ""

    const message =
      (actResult as { message?: string })?.message ||
      `Successfully performed action: "${trimmed}"`

    return {
      success: true,
      message,
      url: finalUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Act: failed to perform action "${trimmed}". ${errorMessage}`,
      { cause: error }
    )
  }
}
