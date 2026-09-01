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

  // Open a blank page per step so each Open URL node results in its own
  // page/tab, visible individually in the Browserbase dashboard — then
  // navigate ONCE. Navigating via newPage(url) AND goto() would reload the
  // same page twice, and waiting for the full "load" event often times out on
  // heavy sites once the tab is already open.
  const page = await stagehand.browser.context.newPage()

  const navigate = () =>
    page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 })

  try {
    await navigate()
  } catch (error) {
    // The tab is already up in the dashboard; transient Browserbase/transport
    // failures clear on a retry, so don't fail the step on the first attempt.
    try {
      await navigate()
    } catch {
      throw new Error(
        `Open URL: failed to load "${url}". ` +
          `The tab opened but navigation didn't complete: ${error instanceof Error ? error.message : String(error)}`,
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

  return { url: page.url(), title }
}
