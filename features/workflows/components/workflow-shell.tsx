"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { RightSidebar } from "@/features/workflows/components/right-sidebar"

// react-resizable-panels v4 interprets numeric sizes as pixels.
// 1rem = 16px, so rem sizes are converted to px accordingly.
const REM = 16

export function WorkflowShell({ workflowId }: { workflowId: string }) {
  return (
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
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Canvas
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={8 * REM} minSize={6 * REM}>
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Logs
            </div>
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
  )
}
