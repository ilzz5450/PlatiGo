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
    const html = await page.evaluate(() => {
      // Clean and collect all meaningful text rows and table structures
      const clone = document.documentElement.cloneNode(true) as HTMLElement
      const scripts = clone.querySelectorAll("script, style, noscript, iframe")
      scripts.forEach((el) => el.remove())
      return clone.innerText || clone.textContent || ""
    })

    const cleanedText = html
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 3)
      .slice(0, 80)
      .join("\n")

    const result = cleanedText || "No content extracted from page."

    return {
      result,
      url: currentUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Extract: failed to extract data from page for "${trimmed}". ${errorMessage}`,
      { cause: error }
    )
  }
}