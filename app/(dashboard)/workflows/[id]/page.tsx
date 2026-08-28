export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex min-h-screen w-full flex-col p-6">
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Workflow ID: {id}</p>
      </div>
    </div>
  )
}
