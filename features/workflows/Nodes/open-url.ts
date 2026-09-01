import type { Stagehand } from "@browserbasehq/stagehand"

export async function openUrl({
  stagehand,
  url,
}: {
  stagehand: Stagehand
  url: string
}) {
  const trimmed = (url ?? "").trim()
  const isHttp =
    /^https?:\/\//i.test(trimmed) || /^[^\/\s]+\.[^\/\s]+/i.test(trimmed)

  if (!trimmed || !isHttp) {
    throw new Error(
      `Open URL: invalid or missing URL for this step (got "${url}"). ` +
        `Enter a full URL like "https://example.com" or a {{ nodeId.url }} reference to an upstream node's URL output.`
    )
  }

  // Reuse the session's first page instead of opening a fresh tab per step.
  // One tab means one clean navigation per step — no orphaned blank tabs from
  // failed navigations, no create-tab transport races, and the whole flow stays
  // in a single Browserbase recording. (If the session somehow has no page
  // yet, create one.)
  let [page] = await stagehand.browser.context.pages()
  if (!page) {
    page = await stagehand.browser.context.newPage()
  }

  const navigate = () =>
    page.goto(trimmed, { waitUntil: "domcontentloaded", timeout: 60_000 })

  try {
    await navigate()
  } catch (error) {
    // Transient Browserbase/transport failures clear on a retry, so don't
    // fail the step on the first attempt.
    try {
      await navigate()
    } catch {
      throw new Error(
        `Open URL: failed to load "${trimmed}". ` +
          `Navigation didn't complete: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    }
  }

  let title = ""
  try {
    title = await page.title()
  } catch {
    // Title reads can throw on some frames; the URL is the useful output.
  }

  // If navigation landed but page.url() reports empty (transport-retry
  // salts), fall back to the resolved URL we actually navigated to so
  // downstream `{{ id.url }}` references never see "".
  const finalUrl = page.url()
  return { url: finalUrl || trimmed, title }
}
