import { auth } from "@clerk/nextjs/server"
import { Browserbase } from "@browserbasehq/sdk"

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return undefined
  }

  const status = (error as { status?: unknown }).status
  return typeof status === "number" ? status : undefined
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { orgId } = await auth()
  if (!orgId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.BROWSERBASE_API_KEY?.trim()
  if (!apiKey) {
    return Response.json(
      { error: "BROWSERBASE_API_KEY is not configured" },
      { status: 503 }
    )
  }

  const { sessionId } = await params
  const pageId = new URL(request.url).searchParams.get("pageId") ?? "0"
  const browserbase = new Browserbase({ apiKey })

  try {
    const replay = await browserbase.sessions.replays.retrieve(sessionId)
    const page =
      replay.pages.find((candidate) => candidate.pageId === pageId) ??
      replay.pages[0]

    if (!page) {
      return Response.json(
        { status: "not_ready", message: "Replay is still processing" },
        { status: 202, headers: { "Cache-Control": "no-store" } }
      )
    }

    const playlist = await browserbase.sessions.replays.retrievePage(
      sessionId,
      page.pageId
    )

    return new Response(await playlist.text(), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/vnd.apple.mpegurl",
      },
    })
  } catch (error) {
    const status = getErrorStatus(error)

    if (status === 404 || status === 409 || status === 425) {
      return Response.json(
        { status: "not_ready", message: "Replay is still processing" },
        { status, headers: { "Cache-Control": "no-store" } }
      )
    }

    console.error("Failed to retrieve Browserbase replay", error)
    return Response.json(
      { error: "Failed to retrieve replay" },
      { status: status && status >= 400 && status < 600 ? status : 502 }
    )
  }
}