import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { WorkflowRunsProvider } from "@/features/workflows/components/workflow-runs-provider"
import { Room } from "@/features/workflows/components/Room"
import { notFound } from "next/navigation"
import { getWorkflow } from "@/features/workflows/data"
import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { liveblocks } from "@/lib/liveblocks" // advange of making a reusable component 

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { orgId } = await auth()
  if (!orgId) {
    notFound();
  }

  const workflowsList = await getWorkflow(orgId, id)
  const workflow = workflowsList[0]

  if (!workflow) {
    notFound();
  }

  try {
    await liveblocks.getOrCreateRoom(id, {
      organizationId: orgId, // live blocks orgid shown in dashbaord , refer to route.ts under liveblocks/auth for info
      defaultAccesses: [],
      groupsAccesses: {
        [orgId]: ["room:write"],
      },
      metadata: {
        name: workflow.name,
      },
    
    });
  } catch (error) {
    console.error("Failed to get or create Liveblocks room:", error);
  }

  // Mint a short-lived, read-only public token scoped to this workflow's run
  // tag. It lets the client subscribe to this workflow's runs in realtime for
  // about an hour, without exposing the server secret key.
  const runTag = `workflow:${id}`
  const publicAccessToken = await triggerAuth.createPublicToken({
    expirationTime: "1hr",
    scopes: {
      read: {
        tags: [runTag],
      },
    },
  })

  return (
    <Room roomId={id}>
      <WorkflowRunsProvider workflowId={id} publicAccessToken={publicAccessToken}>
        <WorkflowShell workflowId={id} />
      </WorkflowRunsProvider>
    </Room>
  )
}


