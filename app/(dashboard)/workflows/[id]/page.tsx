import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import {Room} from "@/features/workflows/components/Room"
export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Room roomId={id}>
      <WorkflowShell workflowId={id} />
    </Room>
  )
} // creating room id matching the dynamic item rom params so that i can use live blocks as well 

