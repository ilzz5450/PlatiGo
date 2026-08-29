"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { tasks, auth as triggerAuth } from "@trigger.dev/sdk"
import type { testWorkflowTask } from "@/trigger/example"

import { createWorkflow } from "@/features/workflows/data"

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization found")
  }

  const [workflow] = await createWorkflow(orgId, name)

  if (!workflow) {
    throw new Error("Failed to create workflow")
  }

  revalidatePath("/", "layout")

  redirect(`/workflows/${workflow.id}`)
}

export async function runWorkflowAction(workflowId: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization found")
  }

  const handle = await tasks.trigger<typeof testWorkflowTask>("test-workflow", {
    workflowId,
  })

  // Mint a public access token scoped specifically to this run so the frontend can subscribe via useRealtimeRun
  const publicAccessToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [handle.id],
      },
    },
  })

  return { runId: handle.id, publicAccessToken }
}
