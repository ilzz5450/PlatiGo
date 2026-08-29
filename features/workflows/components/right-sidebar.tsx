"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { PlayIcon } from "lucide-react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { runWorkflowAction } from "@/features/workflows/actions"

function RunStatusDisplay({
  runId,
  accessToken,
}: {
  runId: string
  accessToken: string
}) {
  const { run, error } = useRealtimeRun(runId, {
    accessToken,
    skipColumns: ["payload", "output"],
  })

  if (error) {
    return (
      <div className="w-full rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
        Error: {error.message}
      </div>
    )
  }

  if (!run) {
    return (
      <div className="w-full rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground animate-pulse flex items-center justify-between">
        <span>Connecting to run...</span>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
      case "FAILED":
      case "CRASHED":
      case "TIMED_OUT":
        return "bg-destructive/10 text-destructive border-destructive/30"
      case "EXECUTING":
      case "QUEUED":
        return "bg-primary/10 text-primary border-primary/30 animate-pulse"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="w-full rounded-md border border-border bg-card p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-muted-foreground text-[10px]">
          {run.id.slice(0, 12)}...
        </span>
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider ${getStatusColor(
            run.status
          )}`}
        >
          {run.status}
        </span>
      </div>
      <div className="text-muted-foreground text-[11px] truncate">
        Task: <span className="text-foreground font-medium">{run.taskIdentifier}</span>
      </div>
    </div>
  )
}

export function RightSidebar({ workflowId }: { workflowId: string }) {
  const [isPending, startTransition] = useTransition()
  const [activeRun, setActiveRun] = useState<{
    runId: string
    publicAccessToken: string
  } | null>(null)

  function handleRun() {
    startTransition(async () => {
      try {
        const result = await runWorkflowAction(workflowId)
        setActiveRun({
          runId: result.runId,
          publicAccessToken: result.publicAccessToken,
        })
      } catch (error) {
        console.error("Failed to run workflow:", error)
      }
    })
  }

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full space-y-4">
          <Button
            className="w-full gap-2"
            onClick={handleRun}
            disabled={isPending}
          >
            <PlayIcon className="size-4" />
            {isPending ? "Triggering..." : "Run"}
          </Button>

          {activeRun && (
            <RunStatusDisplay
              runId={activeRun.runId}
              accessToken={activeRun.publicAccessToken}
            />
          )}
        </div>
      </div>
    </div>
  )
}
