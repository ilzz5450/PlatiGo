"use client"

import { useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { InspectorPanel } from "@/features/workflows/components/inspector-panel"
import { LogsPanel, type SelectedStep } from "@/features/workflows/components/logs-panel"
import { useWorkflowRuns } from "@/features/workflows/components/workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

export function ConsolePanel() {
  const [selectedKey, setSelectedKey] = useState<{
    runId: string
    nodeId: string
  } | null>(null)
  const [clearedAt, setClearedAt] = useState<number | null>(null)

  const { runs } = useWorkflowRuns()

  const visibleRuns = clearedAt
    ? runs.filter((r) => r.createdAt.getTime() > clearedAt)
    : runs

  const activeRun = visibleRuns.find((r) => r.id === selectedKey?.runId)
  const activeStep = activeRun?.steps.find(
    (s) => s.nodeId === selectedKey?.nodeId
  )

  const selectedStep: SelectedStep | null =
    selectedKey && activeStep
      ? { runId: selectedKey.runId, step: activeStep }
      : null

  const handleToggleStep = (runId: string, step: RunStep) => {
    setSelectedKey((current) => {
      if (current?.runId === runId && current?.nodeId === step.nodeId) {
        return null
      }
      return { runId, nodeId: step.nodeId }
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
      {selectedStep ? (
        <ResizablePanelGroup orientation="horizontal" className="size-full">
          <ResizablePanel defaultSize="60%" minSize="30%">
            <LogsPanel
              runs={visibleRuns}
              selectedStep={selectedStep}
              onToggleStep={handleToggleStep}
              onClear={handleClear}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="40%" minSize="25%">
            <InspectorPanel
              step={selectedStep.step}
              onClose={handleCloseInspector}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <LogsPanel
          runs={visibleRuns}
          selectedStep={null}
          onToggleStep={handleToggleStep}
          onClear={handleClear}
        />
      )}
    </div>
  )
}

