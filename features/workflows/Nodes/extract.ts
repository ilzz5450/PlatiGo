import type { Stagehand } from "@browserbasehq/stagehand"
import { z } from "zod"

export async function extract({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const trimmed = (instruction ?? "").trim()

  if (!trimmed) {
    throw new Error(
      `Extract: invalid or missing instruction for this step (got "${instruction}"). ` +
        `Enter an instruction like "Extract the main title" or reference an upstream node.`
    )
  }

  // Reuse the session's first page if available, or create one.
  let [page] = await stagehand.browser.context.pages()
  if (!page) {
    page = await stagehand.browser.context.newPage()
  }

  try {
    const extractResult = await stagehand.extract(
      trimmed,
      z.object({
        result: z
          .string()
          .describe("The extracted data or text requested in the instruction"),
      })
    )

    const rawValue =
      (extractResult as any)?.data?.result ??
      (extractResult as any)?.result ??
      ""

    const result =
      typeof rawValue === "object" ? JSON.stringify(rawValue) : String(rawValue)

    return {
      result,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Extract: failed to extract data for "${trimmed}". ${errorMessage}`,
      { cause: error }
    )
  }
}
//what the fail