"use client"

import prettyMs from "pretty-ms"
import { AlertCircle, CheckCircle2, Film, Terminal, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import {
  useWorkflowRuns,
  type WorkflowRun,
} from "@/features/workflows/components/workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { cn } from "@/lib/utils"

export type SelectedStep = {
  runId: string
  selection: "step"
  nodeId: string
  step: RunStep
}

export type SelectedReplay = {
  runId: string
  selection: "replay"
  sessionId: string
}

export type ConsoleSelection = SelectedStep | SelectedReplay

function ReplayItem({
  runId,
  isSelected,
  onToggle,
}: {
  runId: string
  isSelected: boolean
  onToggle: (runId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(runId)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
        isSelected
          ? "bg-accent font-medium text-accent-foreground ring-1 ring-ring"
          : "hover:bg-muted/60"
      )}
    >
      <Film className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-medium">Replay</span>
      <span className="shrink-0 text-[11px] text-muted-foreground">Recording</span>
    </button>
  )
}

function RunStatusBadge({ run }: { run: WorkflowRun }) {
  if (run.isLive) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-blue-500/30 bg-blue-500/10 text-[11px] text-blue-500"
      >
        <Spinner className="size-3" />
        Running
      </Badge>
    )
  }

  if (run.status === "COMPLETED") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="size-3" />
        Completed
      </Badge>
    )
  }

  if (run.status === "FAILED" || run.status === "CRASHED") {
    return (
      <Badge
        variant="destructive"
        className="gap-1 text-[11px]"
      >
        <AlertCircle className="size-3" />
        Failed
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-[11px]">
      {run.status}
    </Badge>
  )
}

function StepItem({
  runId,
  step,
  isSelected,
  onToggle,
}: {
  runId: string
  step: RunStep
  isSelected: boolean
  onToggle: (runId: string, step: RunStep) => void
}) {
  const isRunning = step.status === "running"
  const isFailed = step.status === "failed"
  const isPending = step.status === "pending"

  return (
    <button
      type="button"
      onClick={() => onToggle(runId, step)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
        isSelected
          ? "bg-accent font-medium text-accent-foreground ring-1 ring-ring"
          : "hover:bg-muted/60",
        isPending && "opacity-40 text-muted-foreground",
        isFailed && "border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
        isRunning && "font-medium text-foreground"
      )}
    >
      <div className="relative shrink-0">
        <NodeIcon type={step.nodeType} running={isRunning} className="size-5" />
      </div>

      <span className="min-w-0 flex-1 truncate font-medium">{step.title}</span>

      <div className="flex shrink-0 items-center gap-1.5 text-right font-mono text-[11px]">
        {isRunning && (
          <span className="text-muted-foreground font-sans">
            running
          </span>
        )}

        {isFailed && step.error && (
          <span className="max-w-40 truncate text-destructive">
            {step.error}
          </span>
        )}

        {step.durationMs !== undefined && (
          <span className={cn(isFailed ? "text-destructive" : "text-muted-foreground")}>
            {prettyMs(step.durationMs)}
          </span>
        )}
      </div>
    </button>
  )
}

export function LogsPanel({
  runs: propRuns,
  selectedSelection,
  onToggleStep,
  onToggleReplay,
  onClear,
}: {
  runs?: WorkflowRun[]
  selectedSelection: ConsoleSelection | null
  onToggleStep: (runId: string, step: RunStep) => void
  onToggleReplay: (runId: string) => void
  onClear?: () => void
}) {
  const { runs: contextRuns } = useWorkflowRuns()
  const runs = propRuns ?? contextRuns

  if (runs.length === 0) {
    return (
      <div className="flex size-full flex-col">
        <div className="flow-panel-3d flex items-center justify-between border-b border-border bg-card px-3 py-1.5 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5" />
            <span>Execution Console</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-4 text-xs text-muted-foreground">
          No workflow runs recorded yet. Click &quot;Run&quot; to execute your workflow.
        </div>
      </div>
    )
  }

  return (
    <div className="flex size-full min-h-0 flex-col">
      <div className="flow-panel-3d flex items-center justify-between border-b border-border bg-card px-3 py-1.5 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5" />
          <span>Execution Console</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-normal text-muted-foreground">
            {runs.length} {runs.length === 1 ? "run" : "runs"}
          </span>
          {onClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-5 gap-1 rounded-xs px-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Clear console"
            >
              <Trash2 className="size-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-4">
        {runs.map((run) => (
          <div
            key={run.id}
            className="rounded-lg border border-border/70 bg-card/50 p-2.5 shadow-xs"
          >
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <RunStatusBadge run={run} />
                <span className="truncate text-xs font-medium text-muted-foreground font-mono">
                  {run.createdAt.toLocaleTimeString()}
                </span>
              </div>

              {run.durationMs !== undefined && (
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {prettyMs(run.durationMs)}
                </span>
              )}
            </div>

            {run.steps.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground italic">
                No steps logged for this run
              </p>
            ) : (
              <div className="space-y-1">
                {run.steps.map((step) => {
                  const isSelected =
                    selectedSelection?.selection === "step" &&
                    selectedSelection.runId === run.id &&
                    selectedSelection.step.nodeId === step.nodeId

                  return (
                    <StepItem
                      key={`${run.id}-${step.nodeId}`}
                      runId={run.id}
                      step={step}
                      isSelected={isSelected}
                      onToggle={onToggleStep}
                    />
                  )
                })}
              </div>
            )}

            {!run.isLive && run.sessionId && (
              <div className="mt-1 space-y-1">
                <ReplayItem
                  runId={run.id}
                  isSelected={
                    selectedSelection?.selection === "replay" &&
                    selectedSelection.runId === run.id
                  }
                  onToggle={onToggleReplay}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
