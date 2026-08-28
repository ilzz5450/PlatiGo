"use client"

import { useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Workflow, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

import { generateSlug } from "@/features/workflows/lib/slug"
import type { Workflow as WorkflowRow } from "@/lib/db/schema"

export function WorkflowNav({
  workflows,
  createWorkflow,
}: {
  workflows: WorkflowRow[]
  createWorkflow: (name: string) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()

  function handleCreateWorkflow() {
    const name = generateSlug()
    startTransition(() => {
      void createWorkflow(name)
    })
  }

  return (
    <>
      <div className="px-2 mb-4 group-data-[collapsible=icon]:hidden">
        <Button
          className="w-full justify-start gap-2 bg-black border border-white/15 text-white hover:bg-neutral-900 font-medium"
          onClick={handleCreateWorkflow}
          disabled={isPending}
        >
          <Plus className="size-4 text-white" />
          <span className="text-white">
            {isPending ? "Creating..." : "New Workflow"}
          </span>
        </Button>
      </div>
      <SidebarGroup>
        <SidebarGroupLabel>Workflows</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {(workflows ?? []).map((workflow) => {
              const href = `/workflows/${workflow.id}`
              const isActive = pathname === href

              return (
                <SidebarMenuItem key={workflow.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={workflow.name}
                  >
                    <Link
                      href={href}
                      className="workflow-nav-link flex items-center gap-3"
                    >
                      <Workflow className="size-4" />
                      <span>{workflow.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
