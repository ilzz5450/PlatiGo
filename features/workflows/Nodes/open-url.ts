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

  // The CDP listener can drop the load signal even though the tab really
  // navigated (the session/tab is recorded fine on Browserbase's side). So a
  // page that has *reached an http(s) URL* counts as success — a lost load
  // event must not turn a working step red.
  const reachedRealUrl = async (): Promise<boolean> => {
    try {
      const currentUrl = await page.url()
      return /^https?:\/\//i.test(currentUrl || "")
    } catch {
      return false
    }
  }

  try {
    await navigate()
  } catch (error) {
    let lastError = error
    if (!(await reachedRealUrl())) {
      try {
        await navigate()
      } catch (retryError) {
        lastError = retryError
      }
    }
    if (!(await reachedRealUrl())) {
      throw new Error(
        `Open URL: failed to load "${trimmed}". ` +
          `Navigation didn't complete: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
        { cause: lastError }
      )
    }
  }

  let title = ""
  try {
    title = await page.title()
  } catch {
    // Title reads can throw on some frames; the URL is the useful output.
  }

  // NOTE: page.url() returns a Promise in Stagehand v4 — it MUST be awaited.
  // Storing the promise leaks an object into node outputs and downstream
  // `{{ id.url }}` references resolve to "" / "{}". If it comes back empty
  // after a transport retry, fall back to the URL we actually navigated to.
  const finalUrl = await page.url()
  return { url: finalUrl || trimmed, title }
}