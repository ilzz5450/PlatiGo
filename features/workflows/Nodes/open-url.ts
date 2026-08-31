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

  // Open a fresh page per step so each Open URL node results in its own
  // page/tab, visible individually in the Browserbase dashboard.
  const page = await stagehand.browser.context.newPage(url)

  await page.goto(url, { waitUntil: "load", timeout: 30_000 })

  return { url: page.url(), title: await page.title() }
}
