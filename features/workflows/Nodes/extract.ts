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

  let [page] = await stagehand.browser.context.pages()
  if (!page) {
    page = await stagehand.browser.context.newPage()
  }

  try {
    const currentUrl = page.url() || ""

    // Use Stagehand's built-in AI extraction schema to guarantee structured multi-item lists & tables
    const extractResult = await stagehand.extract(
      `Extract all relevant items, rows, titles, prices, or structured data matching this request: "${trimmed}". Return them as a clean, structured list or table in text format.`,
      z.object({
        result: z.string().describe("The complete multi-item extracted data formatted cleanly in markdown or tables"),
      })
    )

    const rawValue =
      (extractResult as any)?.data?.result ??
      (extractResult as any)?.result ??
      ""

    const result =
      typeof rawValue === "object" ? JSON.stringify(rawValue, null, 2) : String(rawValue)

    return {
      result,
      url: currentUrl,
    }
  } catch (error) {
    // Fallback to DOM text slicing if Stagehand extract encounters any transient hiccup
    try {
      const html = await page.evaluate(() => document.documentElement.outerHTML)
      const textChunks = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000)

      return {
        result: textChunks,
        url: page.url() || "",
      }
    } catch (fallbackError) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(
        `Extract: failed to extract structured data for "${trimmed}". ${errorMessage}`,
        { cause: fallbackError }
      )
    }
  }
}