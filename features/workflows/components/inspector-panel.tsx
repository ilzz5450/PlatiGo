"use client"

import { useState } from "react"
import prettyMs from "pretty-ms"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Film,
  Info,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { SessionReplay } from "@/features/workflows/components/session-replay"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

type InspectorPanelProps = {
  step?: RunStep
  sessionId?: string
  onClose?: () => void
}

export function InspectorPanel({
  step,
  sessionId,
  onClose,
}: InspectorPanelProps) {
  const [copied, setCopied] = useState(false)

  if (sessionId) {
    return (
      <div className="flex size-full min-h-0 flex-col bg-background">
        <div className="flow-panel-3d flex items-center justify-between border-b border-border bg-card px-3 py-1.5 text-xs font-semibold">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="size-4 shrink-0" />
            <span className="truncate">Replay</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-5 rounded-xs text-muted-foreground hover:text-foreground"
              aria-label="Close replay"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <SessionReplay sessionId={sessionId} className="size-full" />
        </div>
      </div>
    )
  }

  if (!step) return null

  const isRunning = step.status === "running"
  const isFailed = step.status === "failed"
  const isDone = step.status === "done"
  const isPending = step.status === "pending"

  const hasOutput = step.output !== undefined && step.output !== null
  const formattedOutput = hasOutput
    ? typeof step.output === "string"
      ? step.output
      : JSON.stringify(step.output, null, 2)
    : ""

  const handleCopy = async () => {
    const textToCopy = isFailed && step.error ? step.error : formattedOutput
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard error
    }
  }

  return (
    <div className="flex size-full min-h-0 flex-col bg-background">
      {/* Header */}
      <div className="flow-panel-3d flex items-center justify-between border-b border-border bg-card px-3 py-1.5 text-xs font-semibold">
        <div className="flex items-center gap-2 min-w-0">
          <NodeIcon type={step.nodeType} running={isRunning} className="size-4 shrink-0" />
          <span className="truncate">{step.title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isRunning && (
            <Badge
              variant="outline"
              className="gap-1 border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-500"
            >
              <Spinner className="size-2.5" />
              Running
            </Badge>
          )}

          {isDone && (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="size-2.5" />
              Completed
            </Badge>
          )}

          {isFailed && (
            <Badge variant="destructive" className="gap-1 text-[10px]">
              <AlertCircle className="size-2.5" />
              Failed
            </Badge>
          )}

          {isPending && (
            <Badge variant="outline" className="text-[10px]">
              Pending
            </Badge>
          )}

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-5 rounded-xs text-muted-foreground hover:text-foreground"
              aria-label="Close inspector"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Timing info if available */}
        {step.durationMs !== undefined && (
          <div className="flex items-center justify-between text-muted-foreground border-b border-border/40 pb-2">
            <span>Duration</span>
            <span className="font-mono">{prettyMs(step.durationMs)}</span>
          </div>
        )}

        {/* Error view if failed */}
        {isFailed && step.error && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-destructive flex items-center gap-1.5">
                <AlertCircle className="size-3.5" />
                Error
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="size-5 rounded-xs text-muted-foreground hover:text-foreground"
                title="Copy error"
              >
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-md border border-destructive/30 bg-destructive/10 p-2.5 font-mono text-[11px] text-destructive whitespace-pre-wrap break-words">
              {step.error}
            </pre>
          </div>
        )}

        {/* Output view */}
        {hasOutput && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Output</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="size-5 rounded-xs text-muted-foreground hover:text-foreground"
                title="Copy output JSON"
              >
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[11px] text-foreground whitespace-pre-wrap break-words">
              {formattedOutput}
            </pre>
          </div>
        )}

        {/* Empty / note state */}
        {!isFailed && !hasOutput && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-1">
            <Info className="size-4 opacity-60" />
            <p className="text-xs">
              {isPending
                ? "This step has not executed yet."
                : isRunning
                  ? "This step is currently running..."
                  : "No output produced for this step."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
