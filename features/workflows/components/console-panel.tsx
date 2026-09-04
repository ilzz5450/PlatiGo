"use client"

import { useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { InspectorPanel } from "@/features/workflows/components/inspector-panel"
import {
  LogsPanel,
  type ConsoleSelection,
} from "@/features/workflows/components/logs-panel"
import { useWorkflowRuns } from "@/features/workflows/components/workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

export function ConsolePanel() {
  const [selectedKey, setSelectedKey] = useState<ConsoleSelection | null>(null)
  const [clearedAt, setClearedAt] = useState<number | null>(null)

  const { runs } = useWorkflowRuns()

  const visibleRuns = clearedAt
    ? runs.filter((r) => r.createdAt.getTime() > clearedAt)
    : runs

  const activeRun = visibleRuns.find((r) => r.id === selectedKey?.runId)
  const selectedStep = (() => {
    if (selectedKey?.selection !== "step" || !activeRun) return null
    const step = activeRun.steps.find((item) => item.nodeId === selectedKey.nodeId)
    return step ? { ...selectedKey, step } : null
  })()

  const selectedReplay =
    selectedKey?.selection === "replay" && activeRun?.sessionId
      ? { runId: selectedKey.runId, selection: "replay" as const, sessionId: activeRun.sessionId }
      : null

  const handleToggleStep = (runId: string, step: RunStep) => {
    setSelectedKey((current) => {
      if (
        current?.selection === "step" &&
        current.runId === runId &&
        current.nodeId === step.nodeId
      ) {
        return null
      }
      return { runId, selection: "step", nodeId: step.nodeId, step }
    })
  }

  const handleToggleReplay = (runId: string) => {
    setSelectedKey((current) => {
      if (current?.runId === runId && current.selection === "replay") {
        return null
      }
      const run = visibleRuns.find((item) => item.id === runId)
      return run?.sessionId && !run.isLive
        ? { runId, selection: "replay", sessionId: run.sessionId }
        : null
    })
  }

  const handleCloseInspector = () => {
    setSelectedKey(null)
  }

  const handleClear = () => {
    setClearedAt(Date.now())
    setSelectedKey(null)
  }

  return (
    <div className="size-full overflow-hidden bg-background">
      {selectedStep || selectedReplay ? (
        <ResizablePanelGroup orientation="horizontal" className="size-full">
          <ResizablePanel defaultSize="60%" minSize="30%">
            <LogsPanel
              runs={visibleRuns}
              selectedSelection={selectedStep || selectedReplay}
              onToggleStep={handleToggleStep}
              onToggleReplay={handleToggleReplay}
              onClear={handleClear}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="40%" minSize="25%">
            <InspectorPanel
              step={selectedStep?.step}
              sessionId={selectedReplay?.sessionId}
              onClose={handleCloseInspector}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <LogsPanel
          runs={visibleRuns}
          selectedSelection={null}
          onToggleStep={handleToggleStep}
          onToggleReplay={handleToggleReplay}
          onClear={handleClear}
        />
      )}
    </div>
  )
}

