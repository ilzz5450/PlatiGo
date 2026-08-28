"use server"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { Settings2, ShieldAlert, TerminalSquare, Activity } from "lucide-react"

import { WorkflowNav } from "@/features/workflows/components/workflow-nav"
import { listWorkflows } from "@/features/workflows/data"
import { createWorkflowAction } from "@/features/workflows/actions"
import { SidebarCollapseButton } from "@/features/workflows/components/sidebar-collapse-button"

export async function AppSidebar() {
  const { orgId } = await auth()

  const workflows = orgId ? await listWorkflows(orgId) : []

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3 flex flex-row items-center justify-between relative z-40 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
        <div className="hidden md:flex items-center gap-2 overflow-hidden flex-1 group-data-[collapsible=icon]:hidden">
          <OrganizationSwitcher
            afterCreateOrganizationUrl="/choose-organization"
            afterSelectOrganizationUrl="/"
            afterLeaveOrganizationUrl="/choose-organization"
            hidePersonal={false}
            appearance={{
              elements: {
                rootBox: "w-full max-w-full overflow-hidden",
                organizationSwitcherTrigger:
                  "w-full justify-between bg-transparent hover:bg-sidebar-accent py-1.5 px-2 rounded-md text-sidebar-foreground truncate",
                organizationPreviewMainIdentifier:
                  "text-sidebar-foreground font-medium",
                organizationPreviewSecondaryIdentifier:
                  "text-muted-foreground",
              },
            }}
          />
        </div>
        <SidebarCollapseButton />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-1">
        <WorkflowNav workflows={workflows} createWorkflow={createWorkflowAction} />

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Execution Logs">
                  <a href="#" className="flex items-center gap-3">
                    <TerminalSquare className="size-4" />
                    <span>Execution Logs</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="System Health">
                  <a href="#" className="flex items-center gap-3">
                    <Activity className="size-4" />
                    <span>System Health</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Security & Access">
                  <a href="#" className="flex items-center gap-3">
                    <ShieldAlert className="size-4" />
                    <span>Security & Access</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <a href="#" className="flex items-center gap-3">
                    <Settings2 className="size-4" />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 relative z-40 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <div className="hidden md:flex items-center justify-start group-data-[collapsible=icon]:justify-center">
          <UserButton
            showName
            appearance={{
              elements: {
                userButtonBox:
                  "flex-row gap-3 justify-start group-data-[collapsible=icon]:justify-center",
                userButtonOuterIdentifier:
                  "text-sidebar-foreground font-medium text-sm group-data-[collapsible=icon]:hidden",
              },
            }}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
