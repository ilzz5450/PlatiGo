import { WorkflowShell } from "@/features/workflows/components/workflow-shell"

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex min-h-screen w-full">
      <WorkflowShell workflowId={id} />
    </div>
  )
}
