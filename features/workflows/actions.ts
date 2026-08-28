"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
