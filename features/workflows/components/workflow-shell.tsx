"use client"

import { ReactFlowProvider } from "@xyflow/react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ConsolePanel } from "@/features/workflows/components/console-panel"
import { RightSidebar } from "@/features/workflows/components/right-sidebar"
import { WorkflowCanvas } from "@/features/workflows/components/workflow-canvas"
import { WorkflowFlowProvider } from "@/features/workflows/components/workflow-flow"

// react-resizable-panels v4 interprets numeric sizes as pixels.
// 1rem = 16px, so rem sizes are converted to px accordingly.
const REM = 16

export function WorkflowShell({ workflowId }: { workflowId: string }) {
  return (
    <ReactFlowProvider>
      <WorkflowFlowProvider>
        <ResizablePanelGroup
      orientation="horizontal"
      className="size-full"
    >
      <ResizablePanel minSize={30 * REM}>
        <ResizablePanelGroup
          orientation="vertical"
          className="size-full"
        >
          <ResizablePanel minSize={18 * REM}>
            <WorkflowCanvas />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={8 * REM} minSize={6 * REM}>
            <ConsolePanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        defaultSize={16 * REM}
        minSize={14 * REM}
        maxSize={36 * REM}
      >
        <RightSidebar workflowId={workflowId} />
      </ResizablePanel>
          </ResizablePanelGroup>
        </WorkflowFlowProvider>
      </ReactFlowProvider>
  )
}
