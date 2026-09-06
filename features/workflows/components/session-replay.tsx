"use client"

import Hls from "hls.js"
import { useEffect, useRef, useState } from "react"

type SessionReplayProps = {
  sessionId: string
  pageId?: string
  className?: string
}

const POLL_INTERVAL_MS = 5_000

export function SessionReplay({
  sessionId,
  pageId = "0",
  className,
}: SessionReplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [status, setStatus] = useState<"waiting" | "loading" | "ready" | "error">("waiting")
  const [error, setError] = useState<string>()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined

    const cleanupPlayer = () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
      video.removeAttribute("src")
      video.load()
    }

    const loadPlaylist = async () => {
      try {
        const response = await fetch(
          `/api/replays/${encodeURIComponent(sessionId)}?pageId=${encodeURIComponent(pageId)}`,
          { cache: "no-store" }
        )

        if (cancelled) return

        if ([202, 404, 409, 425].includes(response.status)) {
          setStatus("waiting")
          pollTimer = setTimeout(loadPlaylist, POLL_INTERVAL_MS)
          return
        }

        if (!response.ok) {
          throw new Error(`Replay request failed (${response.status})`)
        }

        setStatus("loading")
        await response.text()
        if (cancelled) return

        if (Hls.isSupported()) {
          const hls = new Hls()
          hlsRef.current = hls
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal && !cancelled) {
              setError("The replay could not be played")
              setStatus("error")
            }
          })
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) setStatus("ready")
          })
          // Keep the manifest on the backend route. Browserbase manifests
          // contain signed media URLs, and a blob URL can cause HLS.js to
          // resolve those segments against the wrong origin.
          hls.loadSource(
            `/api/replays/${encodeURIComponent(sessionId)}?pageId=${encodeURIComponent(pageId)}`
          )
          hls.attachMedia(video)
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = `/api/replays/${encodeURIComponent(sessionId)}?pageId=${encodeURIComponent(pageId)}`
          video.addEventListener("loadedmetadata", () => {
            if (!cancelled) setStatus("ready")
          }, { once: true })
        } else {
          throw new Error("This browser does not support HLS playback")
        }
      } catch (requestError) {
        if (cancelled) return
        setError(requestError instanceof Error ? requestError.message : "Replay unavailable")
        setStatus("error")
      }
    }

    cleanupPlayer()
    setError(undefined)
    setStatus("waiting")
    void loadPlaylist()

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
      cleanupPlayer()
    }
  }, [pageId, sessionId])

  return (
    <div className={className}>
      <video
        ref={videoRef}
        controls
        muted
        playsInline
        className="size-full bg-black object-contain"
      />
      {status === "waiting" && (
        <p className="mt-2 text-xs text-muted-foreground">Replay is still processing...</p>
      )}
      {status === "loading" && (
        <p className="mt-2 text-xs text-muted-foreground">Loading replay...</p>
      )}
      {status === "error" && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}