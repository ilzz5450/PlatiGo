"use client"

import * as React from "react"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { 
  GitBranch, 
  Workflow, 
  PlaySquare, 
  Settings2, 
  ShieldAlert, 
  Database, 
  TerminalSquare, 
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function AppSidebar() {
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3 flex flex-row items-center justify-between relative z-40 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
        <div className="flex items-center gap-2 overflow-hidden flex-1 group-data-[collapsible=icon]:hidden">
          <OrganizationSwitcher 
            afterCreateOrganizationUrl="/choose-organization"
            afterSelectOrganizationUrl="/"
            afterLeaveOrganizationUrl="/choose-organization"
            hidePersonal={false}
            appearance={{
              elements: {
                rootBox: "w-full max-w-full overflow-hidden",
                organizationSwitcherTrigger: "w-full justify-between bg-transparent hover:bg-sidebar-accent py-1.5 px-2 rounded-md text-sidebar-foreground truncate",
                organizationPreviewMainIdentifier: "text-sidebar-foreground font-medium",
                organizationPreviewSecondaryIdentifier: "text-muted-foreground",
              }
            }}
          />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:mx-auto"
          title={isCollapsed ? "Open Sidebar" : "Close Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-1">
        <div className="px-2 mb-4 group-data-[collapsible=icon]:hidden">
          <Button className="w-full justify-start gap-2 bg-black border border-white/15 text-white hover:bg-neutral-900 font-medium">
            <Plus className="size-4 text-white" />
            <span className="text-white">New Workflow</span>
          </Button>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Workflows</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Data Ingestion Pipeline">
                  <a href="#" className="flex items-center gap-3">
                    <Workflow className="size-4" />
                    <span>Data Ingestion Pipeline</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="User Auth Sync">
                  <a href="#" className="flex items-center gap-3">
                    <GitBranch className="size-4" />
                    <span>User Auth Sync</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Payment Webhook Handler">
                  <a href="#" className="flex items-center gap-3">
                    <PlaySquare className="size-4" />
                    <span>Payment Webhook Handler</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Database Backup Cron">
                  <a href="#" className="flex items-center gap-3">
                    <Database className="size-4" />
                    <span>Database Backup Cron</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>System</SidebarGroupLabel>
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
        <div className="flex items-center justify-start group-data-[collapsible=icon]:justify-center">
          <UserButton 
            showName={!isCollapsed}
            appearance={{
              elements: {
                userButtonBox: "flex-row gap-3 justify-start group-data-[collapsible=icon]:justify-center",
                userButtonOuterIdentifier: "text-sidebar-foreground font-medium text-sm group-data-[collapsible=icon]:hidden",
              }
            }}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
