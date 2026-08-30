"use server"

import { auth } from "@clerk/nextjs/server"
import { deleteWorkflow, createWorkflow, saveWorkflowGraph } from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"
import { revalidatePath } from "next/cache"
import type { WorkflowGraph } from "@/lib/db/schema"
import { tasks } from "@trigger.dev/sdk"
import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow"

// Server action to create a workflow
export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()
  if (!orgId) {
    throw new Error("Unauthorized")
  }
  await createWorkflow(orgId, name)
  revalidatePath("/")
}

// Server action to delete a workflow from the database and its corresponding Liveblocks room.
export async function deleteWorkflowAction(workflowId: string) {
  const { orgId } = await auth()
  if (!orgId) {
    throw new Error("Unauthorized: No organization selected")
  } // logic for deleting the workflwo form the server side into the neondb postgress 

  // Verify ownership and delete from PostgreSQL database scoped to the current organization via data.ts
  const deleted = await deleteWorkflow(orgId, workflowId)

  if (deleted.length === 0) {
    throw new Error("Workflow not found or unauthorized")
  }

  // Clean up the Liveblocks room using the workflow id as the room id
  try {
    await liveblocks.deleteRoom(workflowId)
  } catch (error) {
    // Room might already be deleted or not exist yet, safe to ignore or log
    console.error("Failed to delete Liveblocks room:", error)
  }

  revalidatePath("/")
  return { success: true }
}

// server action to trigger running a workflow via Trigger.dev
export async function runWorkflowAction({
  id,
  graph,
}: {
  id: string
  graph: WorkflowGraph
}) {
  const { orgId } = await auth()
  if (!orgId) {
    throw new Error("Unauthorized: No organization selected")
  }

  await saveWorkflowGraph({ orgId, id, graph })

  const handle = await tasks.trigger<typeof runWorkflowTask>("run-workflow", {
    workflowId: id,
    orgId,
  }, {
    tags: [`workflow:${id}`],
  })

  return handle
}
