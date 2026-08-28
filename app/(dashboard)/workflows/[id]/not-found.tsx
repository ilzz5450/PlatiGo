import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { FolderX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col p-6">
      <div className="flex flex-1 items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderX className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Workflow not found</EmptyTitle>
            <EmptyDescription>
              The workflow you&apos;re looking for doesn&apos;t exist.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </div>
  )
}
