import type { Stagehand } from "@browserbasehq/stagehand"

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
    // Use Playwright/Stagehand page evaluation to get page HTML content for Scrapling-style free extraction
    const html = await page.evaluate(() => document.documentElement.outerHTML)

    const textChunks = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    let extractedValue = textChunks.slice(0, 4000)
    const lowerInst = trimmed.toLowerCase()

    if (lowerInst.includes("title")) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch?.[1]) {
        extractedValue = titleMatch[1].trim()
      }
    } else if (lowerInst.includes("price")) {
      const priceMatch = textChunks.match(/(\$[0-9]+(?:\.[0-9]{2})?)/)
      if (priceMatch?.[1]) {
        extractedValue = priceMatch[1]
      }
    } else if (lowerInst.includes("email")) {
      const emailMatch = textChunks.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
      if (emailMatch?.[0]) {
        extractedValue = emailMatch[0]
      }
    }

    return {
      result: extractedValue,
      url: currentUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Extract: failed to extract data using free scraper for "${trimmed}". ${errorMessage}`,
      { cause: error }
    )
  }
}