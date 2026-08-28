"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

export function SidebarCollapseButton() {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="hidden md:inline-flex h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:mx-auto"
      title={isCollapsed ? "Open Sidebar" : "Close Sidebar"}
    >
      {isCollapsed ? (
        <PanelLeftOpen className="size-4" />
      ) : (
        <PanelLeftClose className="size-4" />
      )}
    </Button>
  )
}
