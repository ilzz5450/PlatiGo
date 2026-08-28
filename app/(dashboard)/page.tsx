"use client"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { FolderGit2 } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-screen w-full flex-col p-6">
      <div className="flex flex-1 items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderGit2 className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No workflow selected</EmptyTitle>
            <EmptyDescription>
              Select a workflow from the sidebar or create a new one to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">Create workflow</Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  )
}
